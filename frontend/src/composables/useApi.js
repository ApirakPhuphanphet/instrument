import { ref } from 'vue';

// Determine initial API Base URL
const initialBase = localStorage.getItem('es_hub_api_base') || 'http://localhost:3000';

export const apiBase = ref(initialBase);
export const apiStatus = ref('online');

export const imagePreview = ref({
  isOpen: false,
  url: '',
  downloadUrl: '',
  title: ''
});

export function useApi() {
  function setApiBase(url) {
    const cleaned = (url || '').trim().replace(/\/+$/, '');
    apiBase.value = cleaned;
    localStorage.setItem('es_hub_api_base', cleaned);
    checkHealth();
  }

  async function checkHealth() {
    try {
      const res = await fetch(`${apiBase.value}/health`);
      if (res.ok) {
        apiStatus.value = 'online';
      } else {
        apiStatus.value = 'degraded';
      }
    } catch {
      apiStatus.value = 'offline';
    }
  }

  function resolveImageUrl(url) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    return `${apiBase.value}${url}`;
  }

  function openImagePreview(url, downloadUrl = '', title = '') {
    const resolvedUrl = resolveImageUrl(url);
    imagePreview.value = {
      isOpen: true,
      url: resolvedUrl,
      downloadUrl: downloadUrl || `${resolvedUrl}/download`,
      title: title || 'Image Preview'
    };
  }

  function closeImagePreview() {
    imagePreview.value.isOpen = false;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function formatDateOnly(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '-' : d.toISOString().split('T')[0];
  }

  return {
    apiBase,
    apiStatus,
    setApiBase,
    checkHealth,
    resolveImageUrl,
    imagePreview,
    openImagePreview,
    closeImagePreview,
    formatDate,
    formatDateOnly
  };
}
