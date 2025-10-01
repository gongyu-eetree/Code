const editor = document.getElementById('editor');
const saveButton = document.getElementById('save-button');
const previewButton = document.getElementById('preview-button');
const previewFrame = document.getElementById('preview-frame');
const saveStatus = document.getElementById('save-status');

const filenameMeta = document.querySelector('meta[name="filename"]');
const filename = filenameMeta ? filenameMeta.getAttribute('content') : null;

const updatePreview = () => {
  const doc = previewFrame.contentDocument || previewFrame.contentWindow.document;
  doc.open();
  doc.write(editor.value);
  doc.close();
};

const showStatus = (message, type = 'info') => {
  saveStatus.textContent = message;
  saveStatus.className = type === 'success' ? 'text-success small pt-2' : type === 'error' ? 'text-danger small pt-2' : 'text-muted small pt-2';
};

if (previewButton) {
  previewButton.addEventListener('click', (event) => {
    event.preventDefault();
    updatePreview();
  });
}

if (saveButton && filename) {
  saveButton.addEventListener('click', async () => {
    showStatus('保存中...');
    try {
      const response = await fetch(`/save/${encodeURIComponent(filename)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: editor.value })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || '保存失败');
      }

      const data = await response.json();
      showStatus(data.message || '保存成功', 'success');
    } catch (error) {
      console.error(error);
      showStatus(error.message || '保存时发生错误', 'error');
    }
  });
}

// Initialize preview with current content
if (editor && previewFrame) {
  updatePreview();
}
