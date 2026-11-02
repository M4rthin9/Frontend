export interface EntryCardInput {
  qrDataUrl: string;
  ref: string;
  date: string;
  labels: {
    institution: string;
    title: string;
    reference: string;
    date: string;
    show: string;
    note: string;
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Entry card image unavailable'));
    image.src = src;
  });
}

/** Compose locally: the signed QR is unchanged and no identity data is included. */
export async function createEntryCard(input: EntryCardInput): Promise<Blob> {
  await Promise.all([
    document.fonts.load('500 37px Kanit', input.labels.institution),
    document.fonts.load('400 29px Kanit', input.labels.show + input.date),
    document.fonts.load('600 48px Kanit', input.ref),
  ]);
  await document.fonts.ready;
  const [qr, seal] = await Promise.all([
    loadImage(input.qrDataUrl),
    loadImage('/cida-logo-192.webp'),
  ]);
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1580;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Entry card canvas unavailable');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 1080, 1580);
  ctx.fillStyle = '#0b1f33';
  ctx.fillRect(0, 0, 1080, 302);
  ctx.fillStyle = '#c6a66b';
  ctx.fillRect(0, 302, 1080, 6);
  ctx.drawImage(seal, 68, 62, 116, 116);
  function text(
    value: string,
    x: number,
    y: number,
    size: number,
    color: string,
    maxWidth = 944,
    weight = 400,
  ) {
    ctx!.font = `${weight} ${size}px Kanit, sans-serif`;
    ctx!.fillStyle = color;
    ctx!.fillText(value, x, y, maxWidth);
  }
  text(input.labels.institution, 216, 116, 37, '#ffffff', 790, 500);
  text(input.labels.title, 216, 168, 29, '#e4d1ae', 790);
  text('SMART CHECK-IN', 68, 254, 26, '#e4d1ae');
  // Extra white space surrounds the backend QR's own quiet zone.
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(qr, 150, 366, 780, 780);
  ctx.imageSmoothingEnabled = true;
  ctx.textAlign = 'center';
  text(input.labels.reference, 540, 1204, 25, '#5a6876');
  text(input.ref, 540, 1265, 48, '#0b1f33', 944, 600);
  text(`${input.labels.date} · ${input.date}`, 540, 1322, 29, '#253d51');
  ctx.fillStyle = '#f2f5f7';
  ctx.fillRect(0, 1370, 1080, 210);
  text(input.labels.show, 540, 1444, 29, '#0b1f33');
  text(input.labels.note, 540, 1500, 23, '#5a6876');
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Entry card export unavailable'))),
      'image/png',
    );
  });
}
