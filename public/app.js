const $=id=>document.getElementById(id),canvas=$('poster'),ctx=canvas.getContext('2d');
const base=new Image(),overlay=new Image();
let portrait=null,cutoutCache=null,file=null,busy=false,ready=false,overlayReady=false,fontReady=false,revision=0;
const gold='#fce28b',ivory='#ffffff';

const PRESET_CAPTIONS=[
  {
    title:"Mẫu 1 · Hợp Tác – Đồng Hành – Phát Triển (Trang trọng)",
    text:"🤝 NGUYÊN PHÁT — HỢP TÁC · ĐỒNG HÀNH · PHÁT TRIỂN!\n✨ Tự hào đồng hành cùng Quý Đối tác và Khách hàng kiến tạo những công trình vững chắc, những giá trị bền vững theo thời gian.\n🚀 Chúc Nguyên Phát cùng Quý Đối tác ngày càng gắn kết và bứt phá mạnh mẽ!\n#NguyenPhat #HopTacDongHanhPhatTrien #XayDungNguyenPhat #DoiTacTinCay #KingAI"
  },
  {
    title:"Mẫu 2 · Tinh thần gắn kết & Uy tín thương hiệu",
    text:"🌟 Uy tín tạo dựng niềm tin — Chất lượng khẳng định vị thế!\nTrên mỗi chặng đường phát triển, Nguyên Phát luôn trân trọng sự tin tưởng và đồng hành của Quý Khách hàng, Đối tác và đội ngũ anh em.\n🏗️ NGUYÊN PHÁT: Hợp Tác – Đồng Hành – Phát Triển bền vững! 💼🏆\n#NguyenPhat #HopTacPhatTrien #DongHanhBenVung #KienTaoGiaTri #KingAI"
  },
  {
    title:"Mẫu 3 · Đội ngũ & Tập thể Nguyên Phát vững mạnh",
    text:"🔥 Tại Nguyên Phát, sức mạnh lớn nhất chính là sự đoàn kết, tận tâm và tinh thần luôn tiến về phía trước!\n🤝 Cùng nhau hợp tác, cùng nhau đồng hành và chinh phục những mục tiêu lớn hơn nữa!\n#NguyenPhat #DaiGiaDinhNguyenPhat #HopTacDongHanhPhatTrien #VuonTamCaoMoi #KingAI"
  },
  {
    title:"Mẫu 4 · Khát vọng kiến tạo & Vươn xa (Truyền cảm hứng)",
    text:"🚀 Mỗi dự án là một dấu ấn của tâm huyết, trách nhiệm và khát vọng vươn tầm!\nCùng Nguyên Phát kết nối nguồn lực, đồng hành kiến tạo những thành công rực rỡ phía trước! 🌐🏗️\n#NguyenPhat #HopTac #DongHanh #PhatTrien #KienTaoThanhCong #KingAI"
  },
  {
    title:"Mẫu 5 · Ngắn gọn, súc tích (Đăng nhanh)",
    text:"✨ NGUYÊN PHÁT — HỢP TÁC · ĐỒNG HÀNH · PHÁT TRIỂN! 🤝🏗️\nCảm ơn Quý Đối tác, Khách hàng và những người đồng đội tuyệt vời đã luôn tin tưởng, đồng hành và cùng nhau phát triển! 🔥\n#NguyenPhat #HopTacDongHanhPhatTrien #KingAI"
  }
];

function copyTextToClipboard(text){
  if(navigator.clipboard&&navigator.clipboard.writeText){
    return navigator.clipboard.writeText(text);
  }
  return new Promise((resolve,reject)=>{
    try{
      const ta=document.createElement('textarea');
      ta.value=text;
      ta.style.position='fixed';
      ta.style.opacity='0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      resolve();
    }catch(e){reject(e)}
  });
}

let selectedCaption = PRESET_CAPTIONS[0];

function renderCaptionList(){
  const container = $('caption-list');
  container.innerHTML = '';
  for(const item of PRESET_CAPTIONS){
    const details = document.createElement('details');
    details.name = 'caption-presets';
    details.className = 'caption-item';
    const title = document.createElement('summary');
    title.className = 'caption-item-title';
    title.textContent = item.title;
    const content = document.createElement('div');
    content.className = 'caption-content';
    const textSpan = document.createElement('div');
    textSpan.textContent = item.text;
    const hint = document.createElement('span');
    hint.className = 'caption-hint';
    hint.textContent = '📋 Chạm vào nội dung này để Copy';
    content.append(textSpan, hint);

    content.onclick = async (e) => {
      e.stopPropagation();
      selectedCaption = item;
      document.querySelectorAll('.caption-content').forEach(el => {
        el.classList.remove('copied');
        const h = el.querySelector('.caption-hint');
        if(h) h.textContent = '📋 Chạm vào nội dung này để Copy';
      });
      try {
        await copyTextToClipboard(item.text);
        content.classList.add('copied');
        hint.textContent = '✅ Đã Copy nội dung này!';
        $('copy-caption').textContent = '✅ Đã Copy!';
        setTimeout(() => { $('copy-caption').textContent = 'Sao chép'; }, 2000);
        status(`✅ Đã copy nội dung “${item.title}” vào bộ nhớ tạm!`);
      } catch {
        status('Hãy giữ vào đoạn văn bản để sao chép.');
      }
    };

    details.append(title, content);
    details.addEventListener('toggle', ()=>{
      if(details.open) selectedCaption = item;
    });
    container.appendChild(details);
  }
}
renderCaptionList();

$('copy-caption').onclick=async()=>{
  try{
    await copyTextToClipboard(selectedCaption.text);
    $('copy-caption').textContent='✅ Đã Copy!';
    setTimeout(()=>{$('copy-caption').textContent='Sao chép'},2000);
    status('✅ Đã copy mẫu nội dung đăng Facebook vào bộ nhớ tạm!');
  }catch{
    status('Bạn có thể bôi đen và sao chép mẫu nội dung đăng Facebook đang mở.');
  }
};

function status(s){$('status').textContent=s}

function fitText(s,x,y,max,size,font,color,weight=600){
 s=String(s||'').normalize('NFC');
 ctx.fillStyle=color;
 while(size>16){
  ctx.font=`${weight} ${size}px ${font}`;
  if(ctx.measureText(s).width<=max)break;
  size-=1;
 }
 ctx.fillText(s,x,y);
}

function updateControlsState(){
 const hasPhoto=!!portrait;
 $('empty-cta').hidden=hasPhoto;
 $('ai-row').hidden=!hasPhoto;
 $('btn-reset').disabled=!hasPhoto||busy;
 $('cut-main').disabled=!hasPhoto||busy;
 $('pick-btn').textContent=hasPhoto?'📷 Đổi ảnh chân dung khác':'📷 Chọn ảnh chân dung từ máy';
 const disabled=!hasPhoto||busy||!overlayReady;
 $('download').disabled=disabled;
 $('zoom-val').textContent=$('zoom').value+'%';
}

let frameOutline;
function traceFrameOutline(){
 const sample=document.createElement('canvas');
 sample.width=sample.height=1536;
 const sampleContext=sample.getContext('2d');
 sampleContext.drawImage(base,0,0,1536,1536);
 const pixels=sampleContext.getImageData(0,0,1536,1536).data;
 const left=[],right=[];
 const isOutside=(offset)=>pixels[offset+3]===0 || Math.min(pixels[offset],pixels[offset+1],pixels[offset+2])>=235;
 for(let y=0;y<1536;y++){
  let start=0,end=1535;
  while(start<=end && isOutside((y*1536+start)*4))start++;
  while(end>start && isOutside((y*1536+end)*4))end--;
  if(start<=end){left.push([start,y]);right.push([end+1,y]);}
 }
 const outline=new Path2D();
 for(const [x,y] of left.concat(right.reverse()))outline.lineTo(x,y);
 outline.closePath();
 return outline;
}

function render(){
 if(!ready)return;
 ctx.clearRect(0,0,1536,1536);
 ctx.save();
 ctx.fillStyle='#ffffff';
 ctx.fillRect(0,0,1536,1536);
 ctx.drawImage(base,0,0,1536,1536);
 const cx=758,cy=715,r=610;
 if(portrait){
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx,cy,r,0,Math.PI*2);
  ctx.clip();
  let s=Math.max(2*r/portrait.width,2*r/portrait.height)*Number($('zoom').value)/100;
  let w=portrait.width*s,h=portrait.height*s;
  ctx.drawImage(portrait,cx-w/2+Number($('x').value)*3.5,cy-h/2+Number($('y').value)*3.5,w,h);
  ctx.restore();
 }
 if(overlayReady){
  ctx.drawImage(overlay,0,0,1536,1536);
 }
 const nameVal=$('name').value.trim();
 const roleVal=$('role').value.trim();
 if(nameVal||roleVal){
  ctx.save();
  const nameFont='"Noto Serif VN", Georgia, serif';
  const roleFont='Arial, sans-serif';
  const nameSize=38,roleSize=25;
  ctx.font=`650 ${nameSize}px ${nameFont}`;
  const nameWidth=ctx.measureText(nameVal.normalize('NFC')).width;
  ctx.font=`500 ${roleSize}px ${roleFont}`;
  const roleWidth=ctx.measureText(roleVal.normalize('NFC')).width;
  const bw=Math.min(640,Math.max(230,nameWidth+70,roleWidth+64));
  const bh=nameVal&&roleVal?92:64;
  const labelX=cx;
  const bx=labelX-bw/2,by=995-bh;
  const fill=ctx.createLinearGradient(bx,by,bx+bw,by+bh);
  fill.addColorStop(0,'#082548');
  fill.addColorStop(1,'#04142b');
  ctx.fillStyle=fill;
  ctx.strokeStyle='#e5be5c';
  ctx.lineWidth=2.5;
  ctx.beginPath();
  ctx.roundRect(bx,by,bw,bh,13);
  ctx.fill();
  ctx.stroke();
  ctx.textAlign='center';
  if(nameVal&&roleVal){
   fitText(nameVal,labelX,by+41,bw-52,nameSize,nameFont,ivory,650);
   fitText(roleVal,labelX,by+74,bw-48,roleSize,roleFont,'#f5d57a',500);
  }else{
   fitText(nameVal||roleVal,labelX,by+(nameVal?44:41),bw-48,nameVal?nameSize:roleSize,nameVal?nameFont:roleFont,nameVal?ivory:'#f5d57a',nameVal?650:500);
  }
  ctx.restore();
 }
 ctx.restore();
 updateControlsState();
 schedulePosterCache();
}

function loadImage(url){
 return new Promise((resolve,reject)=>{
  const im=new Image();
  im.onload=()=>resolve(im);
  im.onerror=reject;
  im.src=url;
 });
}

base.onload=()=>{frameOutline=traceFrameOutline();ready=true;render()};
base.onerror=()=>status('Không tải được khung nền. Hãy tải lại trang.');
base.src='nguyen_phat.png?v=2';

overlay.onload=()=>{overlayReady=true;render()};
overlay.onerror=()=>status('Không tải được lớp khung viền. Hãy tải lại trang.');
overlay.src='frame-overlay.png?v=2';

const fontLoad=document.fonts?document.fonts.load('700 36px "Noto Serif VN"'):Promise.resolve();
fontLoad.catch(()=>{}).finally(()=>{fontReady=true;render()});

['name','role','zoom','x','y'].forEach(id=>$(id).addEventListener('input',render));

$('pick-btn').onclick=()=>$('photo').click();
$('cta-pick').onclick=()=>$('photo').click();

$('btn-reset').onclick=()=>{
 $('zoom').value=100;
 $('x').value=0;
 $('y').value=portrait&&portrait.height>portrait.width*1.15?28:0;
 render();
};

const pointers=new Map();
let startX=0,startY=0,origX=0,origY=0,startDist=0,origZoom=100;

canvas.addEventListener('wheel',e=>{
 if(!portrait)return;
 e.preventDefault();
 const delta=e.deltaY<0?8:-8;
 $('zoom').value=Math.max(60,Math.min(280,Number($('zoom').value)+delta));
 render();
},{passive:false});

canvas.addEventListener('pointerdown',e=>{
 if(!portrait)return;
 canvas.setPointerCapture(e.pointerId);
 pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pointers.size===1){
  startX=e.clientX;
  startY=e.clientY;
  origX=Number($('x').value);
  origY=Number($('y').value);
 }else if(pointers.size===2){
  const pts=[...pointers.values()];
  startDist=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
  origZoom=Number($('zoom').value);
 }
});

canvas.addEventListener('pointermove',e=>{
 if(!portrait||!pointers.has(e.pointerId))return;
 pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pointers.size===2){
  const pts=[...pointers.values()];
  const dist=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
  if(startDist>10){
   const nextZoom=Math.round(origZoom*(dist/startDist));
   $('zoom').value=Math.max(60,Math.min(280,nextZoom));
   render();
  }
 }else if(pointers.size===1){
  const rect=canvas.getBoundingClientRect();
  const scale=1536/rect.width;
  const dx=(e.clientX-startX)*scale/3.5;
  const dy=(e.clientY-startY)*scale/3.5;
  $('x').value=Math.max(-160,Math.min(160,Math.round(origX+dx)));
  $('y').value=Math.max(-180,Math.min(220,Math.round(origY+dy)));
  render();
 }
});

['pointerup','pointercancel'].forEach(ev=>canvas.addEventListener(ev,e=>{
 pointers.delete(e.pointerId);
 if(pointers.size===1){
  const pt=[...pointers.values()][0];
  startX=pt.x;
  startY=pt.y;
  origX=Number($('x').value);
  origY=Number($('y').value);
 }
}));

$('photo').onchange=async e=>{
 const selected=e.target.files[0];
 e.target.value='';
 if(!selected)return;
 if(selected.size>12*1024*1024){status('⚠️ Ảnh vượt 12 MB. Hãy chọn ảnh nhỏ hơn.');return}
 const version=++revision;
 let url=URL.createObjectURL(selected);
 try{
  let im=await loadImage(url);
  if(im.width*im.height>24000000)throw Error('Ảnh quá lớn (tối đa 24 megapixel).');
  if(version!==revision)return;
  file=selected;
  portrait=im;
  cutoutCache=null;
  $('x').value=0;
  $('y').value=im.height>im.width*1.15?28:0;
  $('zoom').value=100;
  status('✅ Đã ghép ảnh! Hãy bấm “Tải ảnh”, chọn Caption để copy rồi bấm “Share Facebook”.');
  render();
 }catch(e){
  status(e.message||'Không đọc được ảnh. Hãy dùng JPG, PNG hoặc WebP.');
 }finally{
  URL.revokeObjectURL(url);
 }
};

async function triggerCutout(){
 if(!file||busy)return;
 if(cutoutCache){
  portrait=cutoutCache;
  status('✨ Đã áp dụng ảnh tách nền AI.');
  render();
  return;
 }
 busy=true;
 const version=revision,selected=file;
 $('cut-main').textContent='⏳ AI đang tách nền…';
 status('⏳ AI đang tách nền nhân vật (khoảng 3–6 giây). Vui lòng chờ…');
 render();
 try{
  let res=await fetch('api/remove-background',{method:'POST',headers:{'Content-Type':'application/octet-stream'},body:selected,signal:AbortSignal.timeout(180000)});
  if(!res.ok){
   let error=await res.json().catch(()=>({}));
   throw Error(error.detail||'Không xử lý được ảnh. Hãy thử lại.');
  }
  let url=URL.createObjectURL(await res.blob());
  try{
   let im=await loadImage(url);
   if(version===revision){
    portrait=cutoutCache=im;
    status('✨ Đã tách nền thành công! Nhân vật đã nổi bật trên nền xanh ánh kim.');
   }
  }finally{
   URL.revokeObjectURL(url);
  }
 }catch(e){
  status(e.name==='TimeoutError'?'⚠️ Xử lý quá lâu. Hãy thử ảnh nhỏ hơn.':('⚠️ '+e.message));
 }finally{
  busy=false;
  $('cut-main').textContent='✨ AI tách nền';
  render();
 }
}

$('cut-main').onclick=triggerCutout;

// Xuất ảnh luôn trên nền trắng (canvas gốc để trong suốt cho phần xem trước)
function exportCanvas(){
 const c=document.createElement('canvas');c.width=canvas.width;c.height=canvas.height;
 const x=c.getContext('2d');x.fillStyle='#ffffff';x.fillRect(0,0,c.width,c.height);x.drawImage(canvas,0,0);
 return c;
}
function canvasBlob(type='image/png',quality=0.92){
 return new Promise((resolve,reject)=>exportCanvas().toBlob(blob=>blob?resolve(blob):reject(Error('Không xuất được ảnh. Hãy thử lại.')),type,quality));
}
function canvasFile(filename){
 if(cachedBlob)return new File([cachedBlob],filename,{type:'image/png'});
 const data=exportCanvas().toDataURL('image/png').split(',')[1],raw=atob(data),bytes=new Uint8Array(raw.length);
 for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
 return new File([bytes],filename,{type:'image/png'});
}

let cachedBlob=null,cacheTimer=null;
function schedulePosterCache(){
 if(cacheTimer)clearTimeout(cacheTimer);
 if(!portrait||!ready){cachedBlob=null;return;}
 cacheTimer=setTimeout(()=>{
  if(!portrait||!ready)return;
  exportCanvas().toBlob(b=>{if(b)cachedBlob=b;},'image/png');
 },120);
}

let savePreviewUrl=null;
function showSavePreview(url){
 $('save-image').src=url;
 $('save-preview').hidden=false;
 document.body.classList.add('modal-open');
}
function closeSavePreview(){
 $('save-preview').hidden=true;
 $('save-image').removeAttribute('src');
 document.body.classList.remove('modal-open');
 if(savePreviewUrl){URL.revokeObjectURL(savePreviewUrl);savePreviewUrl=null}
}
$('close-save').onclick=closeSavePreview;
$('save-preview').onclick=e=>{if(e.target===$('save-preview'))closeSavePreview()};

$('download').onclick=async()=>{
 if(!portrait||busy)return;
 const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 const isMobile=isIOS||/Android|Mobile/i.test(navigator.userAgent)||matchMedia('(pointer: coarse)').matches;
 const rawName=$('name').value.trim().normalize('NFC').replace(/[^\p{L}\p{N} -]/gu,'').trim();
 const filename=rawName?('nguyen_phat-'+rawName+'.png'):'nguyen_phat.png';

 if(isIOS&&navigator.share){
  try{
   const posterFile=canvasFile(filename);
   if(!navigator.canShare||navigator.canShare({files:[posterFile]})){
    await navigator.share({files:[posterFile]});
    status('✅ Đã mở bảng Lưu hình ảnh! Hãy chọn “Lưu hình ảnh” (Save Image) để lưu vào Thư viện Ảnh.');
    return;
   }
  }catch(e){
   if(e&&e.name==='AbortError'){
    status('Đã đóng bảng Lưu ảnh.');
    return;
   }
  }
 }

 busy=true;
 status('⏳ Đang tải hình ảnh chất lượng cao 1536 × 1536 px về máy…');
 render();
 try{
  const blob=cachedBlob||await canvasBlob();
  if(isMobile){
   const res=await fetch('api/download',{method:'POST',headers:{'Content-Type':'application/octet-stream'},body:blob});
   if(res.ok){
    const data=await res.json();
    const dlUrl='api/download/'+encodeURIComponent(data.id)+'?filename='+encodeURIComponent(filename);
    const a=document.createElement('a');
    a.href=dlUrl;
    a.download=filename;
    a.style.display='none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    status('✅ Đang tải file ảnh về máy…');
    return;
   }
  }
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=filename;
  a.style.display='none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),10000);
  status('✅ Đã tải ảnh về máy thành công!');
 }catch(e){
  status(e.name==='AbortError'?'Đã đóng bảng Lưu ảnh.':('⚠️ '+(e.message||'Không xuất được ảnh.')));
 }finally{
  busy=false;
  render();
 }
};

$('share-fb').onclick=async()=>{
 const caption=selectedCaption.text;
 try{
  if(caption){
   await copyTextToClipboard(caption);
   $('copy-caption').textContent='✅ Đã Copy!';
   setTimeout(()=>{$('copy-caption').textContent='Sao chép'},2000);
  }
 }catch{}
 status('✅ Đã tự động copy mẫu nội dung và chuyển sang Facebook để bạn đăng bài!');
 window.open('https://www.facebook.com/','_blank','noopener,noreferrer');
};
