import asyncio
import html
import io
import mimetypes
import os
import time
import urllib.parse
import uuid
from pathlib import Path
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import Response, HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image, UnidentifiedImageError

app = FastAPI(docs_url=None, redoc_url=None)
root = Path(__file__).parent / 'public'
shares_dir = root / 'shares'
shares_dir.mkdir(parents=True, exist_ok=True)

mimetypes.add_type('font/ttf', '.ttf')
gate = asyncio.Semaphore(1)
session = None

def cleanup_old_shares():
    try:
        now = time.time()
        files = sorted(
            list(shares_dir.glob('*.jpg')) + list(shares_dir.glob('*.png')),
            key=lambda p: p.stat().st_mtime,
        )
        for f in files[:-600]:
            if f.name != 'default-og.jpg':
                f.unlink(missing_ok=True)
        for f in files:
            if f.name != 'default-og.jpg' and now - f.stat().st_mtime > 7 * 86400:
                f.unlink(missing_ok=True)
    except Exception:
        pass

def make_og_banner(square_img: Image.Image) -> Image.Image:
    W, H = 1200, 630
    bg = Image.new('RGB', (W, H), (255, 255, 255))
    fg_size = 620
    fg = square_img.resize((fg_size, fg_size), Image.Resampling.LANCZOS)
    bg.paste(fg, ((W - fg_size) // 2, (H - fg_size) // 2))
    return bg

@app.get('/health')
def health():
    return {'ok': True}

def cut(data):
    global session
    from rembg import new_session, remove
    if session is None:
        session = new_session('u2netp')
    return remove(data, session=session)

@app.post('/api/remove-background')
async def remove_background(request: Request):
    if gate.locked():
        raise HTTPException(429, 'Máy đang xử lý ảnh khác. Vui lòng thử lại sau ít giây.')
    async with gate:
        data = bytearray()
        async for chunk in request.stream():
            data.extend(chunk)
            if len(data) > 12 * 1024 * 1024:
                raise HTTPException(413, 'Ảnh tối đa 12 MB.')
        try:
            with Image.open(io.BytesIO(data)) as img:
                if img.width * img.height > 24_000_000:
                    raise HTTPException(413, 'Ảnh tối đa 24 megapixel.')
                from PIL import ImageOps
                img = ImageOps.exif_transpose(img).convert('RGBA')
                img.thumbnail((1800, 1800))
                stream = io.BytesIO()
                img.save(stream, format='PNG')
        except (UnidentifiedImageError, OSError, Image.DecompressionBombError):
            raise HTTPException(400, 'Không đọc được ảnh. Hãy dùng JPG, PNG hoặc WebP.')
        try:
            result = await asyncio.to_thread(cut, stream.getvalue())
        except Exception:
            raise HTTPException(503, 'AI chưa sẵn sàng. Hãy thử lại hoặc dùng ảnh gốc / PNG đã tách nền.')
        return Response(result, media_type='image/png', headers={'Cache-Control': 'no-store'})

@app.post('/api/download')
async def create_download(request: Request):
    data = bytearray()
    async for chunk in request.stream():
        data.extend(chunk)
        if len(data) > 15 * 1024 * 1024:
            raise HTTPException(413, 'Ảnh quá lớn.')
    try:
        with Image.open(io.BytesIO(data)) as img:
            img.verify()
        with Image.open(io.BytesIO(data)) as img:
            rgba = img.convert('RGBA')
        flat = Image.new('RGB', rgba.size, (255, 255, 255))
        flat.paste(rgba, mask=rgba.getchannel('A'))  # luôn nền trắng
        dl_id = uuid.uuid4().hex[:14]
        png_path = shares_dir / f"{dl_id}.png"
        flat.save(png_path, format='PNG')
        cleanup_old_shares()
    except Exception:
        raise HTTPException(400, 'Không lưu được file tải về.')
    return {'id': dl_id}

@app.get('/api/download/{dl_id}')
async def get_download_file(dl_id: str, filename: str = 'nguyen_phat.png'):
    safe_id = ''.join(c for c in dl_id if c.isalnum())
    png_path = shares_dir / f"{safe_id}.png"
    if not png_path.exists():
        raise HTTPException(404, 'File not found')
    clean_filename = ''.join(c for c in filename if c.isalnum() or c in ('-', '_', '.')).strip()
    if not clean_filename.endswith('.png'):
        clean_filename = 'nguyen_phat.png'
    quoted = urllib.parse.quote(filename if filename.endswith('.png') else 'nguyen_phat.png')
    headers = {
        'Content-Disposition': f'attachment; filename="{clean_filename}"; filename*=UTF-8\'\'{quoted}',
        'Cache-Control': 'no-store',
    }
    return FileResponse(png_path, media_type='application/octet-stream', headers=headers)

@app.post('/api/share')
async def create_share(request: Request):
    data = bytearray()
    async for chunk in request.stream():
        data.extend(chunk)
        if len(data) > 12 * 1024 * 1024:
            raise HTTPException(413, 'Ảnh quá lớn.')
    try:
        with Image.open(io.BytesIO(data)) as img:
            rgba = img.convert('RGBA')
            img = Image.new('RGB', rgba.size, (255, 255, 255))
            img.paste(rgba, mask=rgba.getchannel('A'))
            img.thumbnail((1536, 1536))
            share_id = uuid.uuid4().hex[:12]
            full_path = shares_dir / f"{share_id}-full.jpg"
            og_path = shares_dir / f"{share_id}.jpg"
            img.save(full_path, format='JPEG', quality=92, optimize=True)
            og_banner = make_og_banner(img)
            og_banner.save(og_path, format='JPEG', quality=92, optimize=True)
            cleanup_old_shares()
    except Exception:
        raise HTTPException(400, 'Không lưu được ảnh chia sẻ.')
    return {'id': share_id}

@app.api_route('/s/{share_id}', methods=['GET', 'HEAD'])
async def get_share_page(request: Request, share_id: str, name: str = ''):
    safe_id = ''.join(c for c in share_id if c.isalnum())
    img_path = shares_dir / f"{safe_id}.jpg"
    if not img_path.exists():
        raise HTTPException(404, 'Not found')
    clean_name = html.escape(name.strip()[:60])
    title = f"{clean_name} · NGUYÊN PHÁT — Hợp Tác · Đồng Hành · Phát Triển" if clean_name else "NGUYÊN PHÁT · Hợp Tác - Đồng Hành - Phát Triển"
    desc = "Nguyên Phát — Hợp Tác, Đồng Hành, Phát Triển! Bấm vào đây để tạo khung hình thương hiệu của bạn."
    img_url = f"https://sukienai.com/nguyen_phat/shares/{safe_id}.jpg"
    full_img_url = f"https://sukienai.com/nguyen_phat/shares/{safe_id}-full.jpg"
    page_url = f"https://sukienai.com/nguyen_phat/s/{safe_id}" + (f"?name={html.escape(name.strip())}" if clean_name else "")
    target_url = "https://sukienai.com/nguyen_phat/"
    html_doc = f'''<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<meta property="og:type" content="article">
<meta property="og:site_name" content="NGUYÊN PHÁT · KING AI">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{page_url}">
<meta property="og:image" content="{img_url}">
<meta property="og:image:secure_url" content="{img_url}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="{img_url}">
</head>
<body style="margin:0;background:#071224;color:#fff;font-family:system-ui,sans-serif;text-align:center;padding:28px 16px">
<div style="max-width:560px;margin:auto">
  <h1 style="color:#f5d06c;font-size:22px;margin:0 0 12px">{title}</h1>
  <img src="{full_img_url}" alt="{title}" style="width:100%;max-width:480px;border-radius:16px;box-shadow:0 20px 50px #000a;margin-bottom:18px">
  <p><a href="{target_url}" style="display:inline-block;background:linear-gradient(135deg,#ffe48a,#d9a12c);color:#081120;font-weight:700;padding:14px 26px;border-radius:999px;text-decoration:none">📷 Tạo khung hình Nguyên Phát của bạn ngay →</a></p>
</div>
<script>
if (!/facebookexternalhit|Facebot|Twitterbot|Pinterest|Slackbot|TelegramBot|WhatsApp|Zalo/i.test(navigator.userAgent)) {{
  setTimeout(function() {{ window.location.replace("{target_url}"); }}, 800);
}}
</script>
</body>
</html>'''
    return HTMLResponse(html_doc, headers={'Cache-Control': 'no-cache'})

@app.middleware('http')
async def headers(request, call_next):
    response = await call_next(request)
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['Referrer-Policy'] = 'same-origin'
    if request.url.path == '/' or request.url.path.endswith('.html'):
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    return response

app.mount('/', StaticFiles(directory=root, html=True), name='public')
