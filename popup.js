const fileInput = document.getElementById('files');
const quality = document.getElementById('quality');
const qualityVal = document.getElementById('qualityVal');
const format = document.getElementById('format');
const maxWidth = document.getElementById('maxWidth');
const compressBtn = document.getElementById('compress');
const results = document.getElementById('results');
const downloadAll = document.getElementById('downloadAll');

let compressed = []; // { name, blob, url, origSize, newSize }

quality.oninput = () => { qualityVal.textContent = quality.value; };

compressBtn.onclick = async () => {
  const files = fileInput.files;
  if (!files.length) { alert('先选图片 / Select images first'); return; }
  results.innerHTML = '';
  compressed = [];
  const q = parseFloat(quality.value);
  const fmt = format.value;
  const mw = parseInt(maxWidth.value) || 0;

  for (const file of files) {
    const { blob, url, newSize } = await compressImage(file, q, fmt, mw);
    const item = { name: file.name, blob, url, origSize: file.size, newSize };
    compressed.push(item);
    renderRow(item);
  }
  downloadAll.style.display = compressed.length ? 'block' : 'none';
};

function compressImage(file, q, fmt, mw) {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target.result; };
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (mw && width > mw) {
        height = Math.round(height * (mw / width));
        width = mw;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      const mime = 'image/' + fmt;
      canvas.toBlob((b) => {
        resolve({ blob: b, url: URL.createObjectURL(b), newSize: b.size });
      }, mime, q);
    };
    reader.readAsDataURL(file);
  });
}

function renderRow(item) {
  const row = document.createElement('div');
  row.className = 'row';
  const ratio = item.newSize / item.origSize;
  const pct = (1 - ratio) * 100;
  const tag = pct >= 0 ? '省 saved' : '增 +';
  row.innerHTML =
    `<span class="name">${item.name}</span>` +
    `<span>${fmtSize(item.origSize)} → ${fmtSize(item.newSize)}（${tag} ${Math.abs(pct).toFixed(1)}%）</span>` +
    `<button>下载 Download</button>`;
  row.querySelector('button').onclick = () => downloadOne(item);
  results.appendChild(row);
}

function fmtSize(b) {
  if (b < 1024) return b + 'B';
  if (b < 1048576) return (b / 1024).toFixed(1) + 'KB';
  return (b / 1048576).toFixed(2) + 'MB';
}

function downloadOne(item) {
  const ext = item.blob.type.split('/')[1];
  const base = item.name.replace(/\.[^.]+$/, '');
  chrome.downloads.download({ url: item.url, filename: base + '_compressed.' + ext });
}

downloadAll.onclick = () => compressed.forEach(downloadOne);
