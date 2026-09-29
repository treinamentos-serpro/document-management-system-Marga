async function readResponse(response) {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || 'Não foi possível concluir a operação.');
  }
  return response;
}

export async function listDocuments() {
  const response = await fetch('/api/documents');
  await readResponse(response);
  return response.json();
}

export async function uploadDocument(file, owner) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'X-User-Id': owner },
    body: formData,
  });
  await readResponse(response);
  return response.json();
}

export async function downloadDocument(id, originalName) {
  const response = await fetch(`/api/documents/${encodeURIComponent(id)}/download`);
  await readResponse(response);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = originalName;
  link.click();
  URL.revokeObjectURL(url);
}
