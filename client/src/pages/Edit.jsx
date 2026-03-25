import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import Modal from '../components/Modal';
import PageEditor from '../components/PageEditor';
import {
  SOCKET_BASE_URL,
  createPage,
  generateSummary,
  getPage,
  getPages,
  getRelationSuggestions,
  updatePage
} from '../utils/api';
import { useAuth } from '../context/AuthContext';

function parseTags(input) {
  return input
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)
    .filter((tag, index, arr) => arr.indexOf(tag) === index);
}

function Edit({ isNew = false, onSaved }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socketRef = useRef(null);

  const [form, setForm] = useState({
    id: '',
    title: '',
    content: '',
    tagsInput: '',
    category: 'General',
    visibility: 'public',
    ai_summary: '',
    related_articles: []
  });
  const [allPages, setAllPages] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [liveStatus, setLiveStatus] = useState(isNew ? 'disconnected' : 'connecting');

  const open = true;
  const collaborative = useMemo(() => !isNew && Boolean(id), [isNew, id]);

  const closeModal = () => {
    if (isNew) {
      navigate('/');
    } else {
      navigate(`/pages/${id}`);
    }
  };

  useEffect(() => {
    getPages()
      .then((data) => setAllPages(data))
      .catch(() => setAllPages([]));
  }, []);

  useEffect(() => {
    if (isNew) return;

    getPage(id)
      .then((data) => {
        if (!data.canEdit) {
          alert('Only the owner can edit this page.');
          navigate(`/pages/${id}`);
          return;
        }

        setForm({
          id: data.id,
          title: data.title,
          content: data.content,
          tagsInput: (data.tags || []).join(', '),
          category: data.category || 'General',
          visibility: data.visibility,
          ai_summary: data.ai_summary || '',
          related_articles: data.related_articles || []
        });
      })
      .catch((error) => {
        alert(error.response?.data?.error || 'Failed to load page');
        navigate('/');
      });
  }, [id, isNew, navigate]);

  useEffect(() => {
    if (!collaborative) return;

    getRelationSuggestions(id)
      .then((data) => setSuggestions(data))
      .catch(() => setSuggestions([]));
  }, [collaborative, id]);

  useEffect(() => {
    if (!collaborative) return;

    const socket = io(SOCKET_BASE_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setLiveStatus('connected');
      socket.emit('join-page', { pageId: id, userId: user?.id });
    });

    socket.on('disconnect', () => {
      setLiveStatus('connecting');
    });

    socket.on('remote-content-change', ({ content, userId }) => {
      if (!userId || userId === user?.id) return;
      setForm((prev) => ({ ...prev, content }));
    });

    return () => {
      socket.emit('leave-page', { pageId: id, userId: user?.id });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [collaborative, id, user?.id]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onContentChange = (content) => {
    setForm((prev) => ({ ...prev, content }));

    if (collaborative && socketRef.current) {
      socketRef.current.emit('content-change', {
        pageId: id,
        content,
        userId: user?.id
      });
    }
  };

  const onToggleRelated = (pageId) => {
    setForm((prev) => {
      const exists = prev.related_articles.includes(pageId);
      return {
        ...prev,
        related_articles: exists
          ? prev.related_articles.filter((itemId) => itemId !== pageId)
          : [...prev.related_articles, pageId]
      };
    });
  };

  const onGenerateSummary = async () => {
    if (!form.content.trim()) {
      alert('Add content first.');
      return;
    }

    setGenerating(true);
    try {
      const result = await generateSummary(form.content);
      setForm((prev) => ({ ...prev, ai_summary: result.summary }));
      return result.summary;
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to generate summary');
      return null;
    } finally {
      setGenerating(false);
    }
  };

  const onSave = async () => {
    if (!form.title.trim()) {
      alert('Title is required.');
      return;
    }

    setSaving(true);

    const payload = {
      title: form.title,
      content: form.content,
      tags: parseTags(form.tagsInput),
      category: form.category,
      visibility: form.visibility,
      ai_summary: form.ai_summary,
      related_articles: form.related_articles
    };

    try {
      if (isNew) {
        const created = await createPage(payload);
        onSaved?.();
        navigate(`/pages/${created.id}`);
      } else {
        const updated = await updatePage(id, payload);
        onSaved?.();
        navigate(`/pages/${updated.id}`);
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save page');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={closeModal}
      title={isNew ? 'Create Page' : 'Edit Page'}
      maxWidth="max-w-5xl"
    >
      <PageEditor
        form={form}
        pages={allPages}
        suggestions={suggestions}
        onFieldChange={updateField}
        onContentChange={onContentChange}
        onToggleRelated={onToggleRelated}
        onSave={onSave}
        onGenerateSummary={onGenerateSummary}
        saving={saving}
        generating={generating}
        liveStatus={liveStatus}
      />
    </Modal>
  );
}

export default Edit;
