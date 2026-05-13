/* ============================================================
   AWESOME INVOICE — script.js  v1.0
   Awesome Tech Solution
============================================================ */

'use strict';

/* ══════════════════════════════════════════════════════════
   CONFIG
══════════════════════════════════════════════════════════ */
const CONFIG = {
  email:    'awesometechsolution@gmail.com',
  password: 'Awesome@123',

  company: {
    name:    'AWESOME TECH SOLUTION',
    tagline: 'The champions of security.',
    phone1:  '0767837414',
    phone2:  '0678237414',
    tin:     '176-935-936',
    email:   'awesometechsolution@gmail.com',
    logo:    'https://i.ibb.co/Gf0sRzN6/IMG-20260404-WA0039-1-removebg-preview.webp',
  },

  services: 'CCTV cameras Installation  ·  Electric fence  ·  Installation of Car GPS tracker system  ·  Access control systems  ·  Video intercoms  ·  Networking & Internet Services',

  bank: {
    name:       'CRDB BANK',
    accountNo:  '',     // Admin will fill
    accountName: '',    // Admin will fill
  },

  invoice: {
    prefix: 'ATS-',
    counterKey: 'awesome_v1_counter',
    histKey:    'awesome_v1_history',
  },

  footer: {
    thanks:  'Asante kwa biashara yako',
    company: 'Awesome Tech Solution',
    motto:   '"Usalama wako fahari yetu"',
  },
};

/* ══════════════════════════════════════════════════════════
   STORE
══════════════════════════════════════════════════════════ */
const Store = {
  history: [],

  load() {
    try { this.history = JSON.parse(localStorage.getItem(CONFIG.invoice.histKey) || '[]'); }
    catch(e) { this.history = []; }
  },

  save() {
    localStorage.setItem(CONFIG.invoice.histKey, JSON.stringify(this.history));
  },

  nextNumber() {
    const k = CONFIG.invoice.counterKey;
    const n = parseInt(localStorage.getItem(k) || '0') + 1;
    localStorage.setItem(k, n);
    return CONFIG.invoice.prefix + String(n).padStart(4, '0');
  },

  push(rec)       { this.history.unshift(rec); this.save(); },
  update(id, patch) {
    const idx = this.history.findIndex(h => h.id === id);
    if (idx < 0) return false;
    Object.assign(this.history[idx], patch);
    this.save(); return true;
  },
  remove(id) { this.history = this.history.filter(h => h.id !== id); this.save(); },
  clear()    { this.history = []; this.save(); },
};

/* ══════════════════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════════════════ */
function toast(msg, type = 'info', duration = 3200) {
  const box = document.getElementById('toastBox');
  const el  = document.createElement('div');
  el.className  = 'toast ' + type;
  el.textContent = msg;
  box.appendChild(el);
  setTimeout(() => {
    el.style.opacity    = '0';
    el.style.transition = 'opacity .4s';
    setTimeout(() => el.remove(), 420);
  }, duration);
}

/* ══════════════════════════════════════════════════════════
   UI
══════════════════════════════════════════════════════════ */
const UI = {
  currentView: 'invoice',

  setView(v) {
    ['invoice', 'history'].forEach(x => {
      document.getElementById('view-'  + x).style.display = x === v ? 'block' : 'none';
      document.getElementById('nav-'   + x).classList.toggle('active', x === v);
    });
    const labels = { invoice: 'New Invoice', history: 'History' };
    document.getElementById('topbarTitle').textContent = labels[v] || 'AWESOME INVOICE';
    this.currentView = v;
    if (v === 'history') Hist.render();
    this.closeSidebar();
  },

  openSidebar()  {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('overlay').classList.add('show');
  },
  closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('show');
  },

  updateBadge() {
    const b = document.getElementById('histBadge');
    const n = Store.history.length;
    b.style.display = n > 0 ? 'inline' : 'none';
    b.textContent   = n;
  }
};

/* ══════════════════════════════════════════════════════════
   APP
══════════════════════════════════════════════════════════ */
const App = {
  login() {
    const email = document.getElementById('loginEmail').value.trim();
    const pass  = document.getElementById('loginPass').value;
    if (email === CONFIG.email && pass === CONFIG.password) {
      document.getElementById('loginPage').style.display = 'none';
      document.getElementById('appPage').style.display  = 'flex';
      Store.load();
      this._initForm();
      Hist.render();
      UI.updateBadge();
    } else {
      toast('❌ Email au Password si sahihi!', 'error');
    }
  },

  logout() {
    if (!confirm('Unataka kutoka? / Logout?')) return;
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('appPage').style.display  = 'none';
  },

  _initForm() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('inv_date').value   = today;
    document.getElementById('inv_number').value = Store.nextNumber();
    Rows.add();
  }
};

/* ══════════════════════════════════════════════════════════
   ROWS
══════════════════════════════════════════════════════════ */
const Rows = {
  add() {
    const tbody = document.getElementById('inv_tbody');
    const tr    = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <input class="tbl-input tc" type="number" value="1" min="1"
               oninput="Rows.calcTotals()" />
      </td>
      <td>
        <input class="tbl-input" type="text"
               placeholder="Maelezo ya bidhaa/huduma..." />
      </td>
      <td>
        <input class="tbl-input tr" type="number" value="0" min="0"
               oninput="Rows.calcTotals()" />
      </td>
      <td class="row-total">0</td>
      <td>
        <button class="btn-del" onclick="Rows.remove(this)" title="Futa">×</button>
      </td>`;
    tbody.appendChild(tr);
    this.calcTotals();
  },

  remove(btn) {
    const tbody = document.getElementById('inv_tbody');
    if (tbody.rows.length <= 1) {
      toast('Lazima kuwe na item moja angalau!', 'error');
      return;
    }
    btn.closest('tr').remove();
    this.calcTotals();
  },

  calcTotals() {
    const tbody = document.getElementById('inv_tbody');
    let subtotal = 0;
    Array.from(tbody.rows).forEach(tr => {
      const qty   = parseFloat(tr.cells[0].querySelector('input').value) || 0;
      const price = parseFloat(tr.cells[2].querySelector('input').value) || 0;
      const line  = qty * price;
      tr.cells[3].textContent = fmt(line);
      subtotal += line;
    });
    document.getElementById('inv_subtotal').textContent = fmt(subtotal);
    const labour = parseFloat(document.getElementById('labourCost').value) || 0;
    const grand  = subtotal + labour;
    document.getElementById('inv_total').textContent = fmt(grand);
    return { subtotal, labour, grand };
  },

  getAll() {
    const tbody = document.getElementById('inv_tbody');
    return Array.from(tbody.rows).map(tr => ({
      qty:   parseFloat(tr.cells[0].querySelector('input').value) || 1,
      desc:  tr.cells[1].querySelector('input').value.trim(),
      price: parseFloat(tr.cells[2].querySelector('input').value) || 0,
    }));
  }
};

/* ══════════════════════════════════════════════════════════
   DOCS
══════════════════════════════════════════════════════════ */
const Docs = {
  _collect() {
    const custName = document.getElementById('c_name').value.trim();
    if (!custName) { toast('⚠️ Weka jina la mteja kwanza!', 'error'); return null; }
    const tots = Rows.calcTotals();
    return {
      id:          Date.now(),
      type:        document.getElementById('invDtype').value,
      customer: {
        name:     custName,
        contact:  document.getElementById('c_contact').value.trim(),
        location: document.getElementById('c_location').value.trim(),
      },
      title:       document.getElementById('inv_title').value.trim(),
      number:      document.getElementById('inv_number').value.trim(),
      date:        document.getElementById('inv_date').value,
      items:       Rows.getAll(),
      labourType:  document.getElementById('labourType').value,
      labourCost:  parseFloat(document.getElementById('labourCost').value) || 0,
      subtotal:    tots.subtotal,
      total:       tots.grand,
    };
  },

  save(action) {
    const rec = this._collect();
    if (!rec) return;

    Store.push(rec);
    UI.updateBadge();

    // Reset invoice number
    document.getElementById('inv_number').value = Store.nextNumber();

    if (action === 'print') {
      this._setPrintZone(rec);
      toast('✅ Imehifadhiwa! Inaprint...', 'success');
      setTimeout(() => window.print(), 500);
    } else if (action === 'pdf') {
      toast('⏳ Inaunda PDF...', 'info');
      this._setPrintZone(rec);
      setTimeout(() => this._exportPDF(rec), 600);
    } else if (action === 'word') {
      this._exportWord(rec);
    }
  },

  reprint(rec) { this._setPrintZone(rec); setTimeout(() => window.print(), 400); },
  repdf(rec)   { this._setPrintZone(rec); toast('⏳ Inaunda PDF...', 'info'); setTimeout(() => this._exportPDF(rec), 600); },

  _setPrintZone(rec) {
    document.getElementById('printZone').innerHTML = this._buildHTML(rec);
  },

  /* ══ HTML BUILDER ══ */
  _buildHTML(rec) {
    const c   = CONFIG.company;
    const f   = CONFIG.footer;
    const items = rec.items || [];
    let subtotal = 0;

    const itemRows = items.map(it => {
      const line = (parseFloat(it.qty)||0) * (parseFloat(it.price)||0);
      subtotal += line;
      return `
        <tr>
          <td class="tc">${it.qty}</td>
          <td>${escHtml(it.desc)}</td>
          <td class="tr">${fmt(it.price)}</td>
          <td class="tr tb">${fmt(line)}</td>
        </tr>`;
    }).join('');

    const labour     = parseFloat(rec.labourCost) || 0;
    const grand      = subtotal + labour;
    const labourType = rec.labourType || 'Labour Cost';

    const labourRow = labour > 0 ? `
      <tr class="pz-labour-row">
        <td colspan="3" style="padding:6px 11px;font-style:italic;font-size:12px;color:#334155">${escHtml(labourType)}</td>
        <td class="pz-align-right" style="padding:6px 11px;font-size:12px;font-weight:700;color:#334155">${fmt(labour)}</td>
      </tr>` : '';

    const custContact  = rec.customer.contact  ? `<p>📞 ${escHtml(rec.customer.contact)}</p>` : '';
    const custLocation = rec.customer.location ? `<p>📍 ${escHtml(rec.customer.location)}</p>` : '';

    const paySection = `
      <div class="pz-pay">
        <div class="pz-pay-title">💳 PAYMENT METHOD</div>
        <table class="pz-pay-cols">
          <tr>
            <td class="pz-pay-left" style="width:60%">
              <span class="pz-col-label">🏦 ${CONFIG.bank.name}</span>
              <div class="pz-bank only">
                <div>
                  <div class="bn">${CONFIG.bank.name}</div>
                  <div class="ba">Account No: ${escHtml(CONFIG.bank.accountNo || '—')}</div>
                  <div class="bh">Account Name: ${escHtml(CONFIG.bank.accountName || '—')}</div>
                </div>
              </div>
            </td>
            <td style="width:40%;vertical-align:top;padding-left:14px">
              <span class="pz-col-label">📧 Contact</span>
              <div style="font-size:11px;color:#334155;line-height:1.7">
                <div>📞 ${escHtml(c.phone1)} / ${escHtml(c.phone2)}</div>
                <div>✉ ${escHtml(c.email)}</div>
              </div>
            </td>
          </tr>
        </table>
      </div>`;

    return `
    <div class="pz">
      <div class="pz-hd-awesome">
        <div class="pz-brand">
          <img src="${c.logo}" alt="${c.name}" />
          <div class="pz-brand-txt">
            <h1>${escHtml(c.name)}</h1>
            <p class="tagline">${escHtml(c.tagline)}</p>
            <p>📞 ${escHtml(c.phone1)} / ${escHtml(c.phone2)}</p>
            <p>TIN: ${escHtml(c.tin)}</p>
            <p>✉ ${escHtml(c.email)}</p>
          </div>
        </div>
      </div>

      <div class="pz-services-banner">
        <span>● </span>${escHtml(CONFIG.services)}
      </div>

      <div class="pz-divider"></div>

      <div class="pz-doc-title">${escHtml(rec.type || 'INVOICE')}</div>

      <div class="pz-meta">
        <div>
          <p class="cust">Customer: ${escHtml(rec.customer.name || '')}</p>
          ${custContact}
          ${custLocation}
        </div>
        <div class="right">
          <p>Date: ${escHtml(rec.date || '')}</p>
          <p>Invoice No: ${escHtml(rec.number || '')}</p>
        </div>
      </div>

      <div class="pz-tbl-title">
        ${escHtml((rec.title || 'INVOICE DESCRIPTION').toUpperCase())}
      </div>

      <table class="pz-table">
        <thead>
          <tr>
            <th style="width:9%">Qty</th>
            <th>Description / Maelezo</th>
            <th style="width:20%;text-align:right">Price per Item (TZS)</th>
            <th style="width:18%;text-align:right">Amount (TZS)</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <table class="pz-subtotals" style="width:100%;border-collapse:collapse;margin-top:6px">
        <tr class="pz-subtotal-row">
          <td colspan="3" style="padding:6px 11px;font-size:12px;color:#334155">Subtotal</td>
          <td class="pz-align-right" style="padding:6px 11px;font-size:12px;font-weight:700;color:#334155;text-align:right">${fmt(subtotal)}</td>
        </tr>
        ${labourRow}
        <tr class="pz-grand-row">
          <td colspan="3" style="background:#0f172a;color:#fff;padding:10px 11px;font-weight:800;font-size:13px;text-transform:uppercase;letter-spacing:1px">GRAND TOTAL (TZS)</td>
          <td style="background:#0f172a;color:#fff;text-align:right;padding:10px 11px">
            <span class="pz-total-big">${fmt(grand)}</span>
          </td>
        </tr>
      </table>

      ${paySection}

      <div class="pz-footer">
        <p class="thanks">${escHtml(f.thanks)}</p>
        <p class="company">${escHtml(f.company)}</p>
        <p class="motto">${escHtml(f.motto)}</p>
        <p class="small">📞 ${escHtml(c.phone1)} &middot; ${escHtml(c.email)}</p>
      </div>
    </div>`;
  },

  /* ── PDF ── */
  async _exportPDF(rec) {
    const pz = document.getElementById('printZone');
    pz.style.cssText = `
      display:block; position:fixed; top:-9999px; left:0;
      width:794px; background:#fff; z-index:-1;
    `;
    const pdfStyle = document.createElement('style');
    pdfStyle.id = 'pdf-override';
    pdfStyle.textContent = `
      #printZone, #printZone * {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      #printZone p, #printZone span, #printZone div,
      #printZone td, #printZone th {
        color: #0f172a !important;
      }
      #printZone .pz-footer p, #printZone .pz-brand-txt p,
      #printZone .pz-contact p, #printZone .pz-bank .ba,
      #printZone .pz-bank .bh, #printZone .pz-services-banner {
        color: #1e293b !important;
      }
      #printZone .pz-services-banner span,
      #printZone .pz-total-big,
      #printZone .company,
      #printZone .tagline { color: #f97316 !important; }
      #printZone .pz-table th,
      #printZone .pz-grand-row td { background: #0f172a !important; color: #fff !important; }
      #printZone .pz-services-banner { background: #0f172a !important; color: #fff !important; }
    `;
    document.head.appendChild(pdfStyle);

    try {
      await sleep(350);
      const canvas = await html2canvas(pz, {
        scale: 2, useCORS: true, allowTaint: true,
        backgroundColor: '#ffffff', logging: false, width: 794,
      });
      pz.removeAttribute('style');
      document.getElementById('pdf-override')?.remove();

      const { jsPDF } = window.jspdf;
      const pdf   = new jsPDF('p', 'mm', 'a4');
      const W     = pdf.internal.pageSize.getWidth();
      const H     = pdf.internal.pageSize.getHeight();
      const imgH  = (canvas.height * W) / canvas.width;
      const img   = canvas.toDataURL('image/jpeg', 0.95);

      if (imgH <= H) {
        pdf.addImage(img, 'JPEG', 0, 0, W, imgH);
      } else {
        let page = 0, y = 0;
        while (y < imgH) {
          if (page > 0) pdf.addPage();
          pdf.addImage(img, 'JPEG', 0, -y, W, imgH);
          y += H; page++;
        }
      }
      const fname = `${rec.number || 'Invoice'}_${rec.customer.name || 'Customer'}.pdf`
                      .replace(/\s+/g, '_');
      pdf.save(fname);
      toast('✅ PDF imehifadhiwa!', 'success');

    } catch(err) {
      pz.removeAttribute('style');
      document.getElementById('pdf-override')?.remove();
      console.error('PDF error:', err);
      toast('❌ Hitilafu ya PDF. Jaribu tena.', 'error');
    }
  },

  /* ── WORD ── */
  _exportWord(rec) {
    const c       = CONFIG.company;
    const f       = CONFIG.footer;
    const items   = rec.items || [];
    let subtotal  = 0;

    const rows = items.map(it => {
      const line = (parseFloat(it.qty)||0) * (parseFloat(it.price)||0);
      subtotal += line;
      return `
        <tr>
          <td style="border:1px solid #cbd5e1;padding:8px;text-align:center">${it.qty}</td>
          <td style="border:1px solid #cbd5e1;padding:8px">${escHtml(it.desc)}</td>
          <td style="border:1px solid #cbd5e1;padding:8px;text-align:right">${fmt(it.price)}</td>
          <td style="border:1px solid #cbd5e1;padding:8px;text-align:right;font-weight:700">${fmt(line)}</td>
        </tr>`;
    }).join('');

    const labour     = parseFloat(rec.labourCost) || 0;
    const grand      = subtotal + labour;
    const labourType = rec.labourType || 'Labour Cost';

    const labourRowW = labour > 0 ? `
      <tr>
        <td colspan="3" style="border:1px solid #cbd5e1;padding:8px;font-style:italic;color:#64748b">${escHtml(labourType)}</td>
        <td style="border:1px solid #cbd5e1;padding:8px;text-align:right;font-weight:700">${fmt(labour)}</td>
      </tr>` : '';

    const custDetails = [
      rec.customer.contact  ? `📞 ${rec.customer.contact}`  : '',
      rec.customer.location ? `📍 ${rec.customer.location}` : '',
    ].filter(Boolean).join(' &nbsp;|&nbsp; ');

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>body{font-family:Calibri,Arial,sans-serif;color:#0f172a;padding:22px;font-size:13px}</style>
</head><body>
<table style="width:100%;border-bottom:4px solid #f97316;padding-bottom:12px;margin-bottom:10px">
  <tr>
    <td>
      <h1 style="font-size:18px;font-weight:900;color:#0f172a;margin:0 0 2px;letter-spacing:1px">
        ${escHtml(c.name)}
      </h1>
      <p style="font-size:11px;font-style:italic;color:#f97316;margin:0 0 4px;font-weight:600">
        ${escHtml(c.tagline)}
      </p>
      <p style="font-size:11px;color:#64748b;margin:1px 0">
        📞 ${escHtml(c.phone1)} / ${escHtml(c.phone2)} &nbsp;|&nbsp; TIN: ${escHtml(c.tin)}
      </p>
      <p style="font-size:11px;color:#64748b;margin:1px 0">
        ✉ ${escHtml(c.email)}
      </p>
    </td>
  </tr>
</table>

<div style="background:#0f172a;color:#fff;padding:10px 16px;border-radius:6px;font-size:11px;font-weight:600;margin-bottom:12px;line-height:1.7">
  ${escHtml(CONFIG.services)}
</div>

<h2 style="text-align:center;font-size:20px;font-weight:900;text-decoration:underline;letter-spacing:2px;margin:16px 0 14px">
  ${escHtml(rec.type || 'INVOICE')}
</h2>

<table style="width:100%;margin-bottom:14px">
  <tr>
    <td style="vertical-align:top">
      <p style="font-size:14px;font-weight:800;margin:3px 0">Customer: ${escHtml(rec.customer.name || '')}</p>
      ${custDetails ? `<p style="font-size:12px;color:#64748b;margin:2px 0">${custDetails}</p>` : ''}
    </td>
    <td style="text-align:right;vertical-align:top">
      <p style="font-size:12px;font-weight:600;margin:2px 0">Date: ${escHtml(rec.date || '')}</p>
      <p style="font-size:12px;font-weight:600;margin:2px 0">Invoice No: ${escHtml(rec.number || '')}</p>
    </td>
  </tr>
</table>

<h3 style="text-align:center;font-size:13px;font-weight:800;text-decoration:underline;text-transform:uppercase;letter-spacing:1px;margin:14px 0 10px">
  ${escHtml((rec.title || 'INVOICE DESCRIPTION').toUpperCase())}
</h3>

<table style="width:100%;border-collapse:collapse">
  <thead>
    <tr style="background:#0f172a;color:#fff">
      <th style="border:1.5px solid #1e293b;padding:9px;width:9%;font-size:11px">Qty</th>
      <th style="border:1.5px solid #1e293b;padding:9px;font-size:11px">Description / Maelezo</th>
      <th style="border:1.5px solid #1e293b;padding:9px;width:20%;text-align:right;font-size:11px">Price per Item (TZS)</th>
      <th style="border:1.5px solid #1e293b;padding:9px;width:18%;text-align:right;font-size:11px">Amount (TZS)</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>

<table style="width:100%;border-collapse:collapse;margin-top:4px">
  <tr>
    <td colspan="3" style="padding:7px 9px;font-size:12px;color:#334155;border:1px solid #e2e8f0">Subtotal</td>
    <td style="padding:7px 9px;font-size:12px;font-weight:700;text-align:right;border:1px solid #e2e8f0">${fmt(subtotal)}</td>
  </tr>
  ${labourRowW}
  <tr style="background:#0f172a;color:#fff">
    <td colspan="3" style="padding:10px 9px;font-weight:800;font-size:13px;text-transform:uppercase;letter-spacing:1px">GRAND TOTAL (TZS)</td>
    <td style="padding:10px 9px;text-align:right">
      <span style="font-size:20px;font-weight:900;color:#f97316">${fmt(grand)}</span>
    </td>
  </tr>
</table>

<h3 style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#0f172a;margin-top:20px;padding-top:14px;border-top:2px solid #e2e8f0;margin-bottom:8px">
  💳 PAYMENT METHOD
</h3>
<table style="width:100%;border-collapse:collapse;margin-bottom:10px">
  <tr>
    <td style="border:2px solid #0f172a;padding:14px;background:#f8fafc;vertical-align:middle">
      <strong style="font-size:13px">${escHtml(CONFIG.bank.name)}</strong><br>
      <span style="font-size:12px;color:#334155">Account No: ${escHtml(CONFIG.bank.accountNo || '—')}</span><br>
      <span style="font-size:12px;color:#334155">Account Name: ${escHtml(CONFIG.bank.accountName || '—')}</span>
    </td>
  </tr>
</table>

<div style="margin-top:20px;border-top:2px solid #e2e8f0;padding-top:12px;text-align:center">
  <p style="font-size:15px;font-weight:900;color:#0f172a;margin:0 0 3px">${escHtml(f.thanks)}</p>
  <p style="font-size:13px;font-weight:700;color:#f97316;letter-spacing:1px;margin:0 0 2px">${escHtml(f.company)}</p>
  <p style="font-size:12px;font-style:italic;color:#64748b;margin:0 0 4px">${escHtml(f.motto)}</p>
  <p style="font-size:10px;color:#94a3b8">📞 ${escHtml(c.phone1)} &middot; ${escHtml(c.email)}</p>
</div>
</body></html>`;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${rec.number || 'Invoice'}_${rec.customer.name || 'Customer'}.doc`
                   .replace(/\s+/g, '_');
    a.click();
    URL.revokeObjectURL(url);
    toast('✅ Word imehifadhiwa!', 'success');
  }
};

/* ══════════════════════════════════════════════════════════
   HIST
══════════════════════════════════════════════════════════ */
const Hist = {
  _editId: null,

  render() {
    const tbody = document.getElementById('histTbody');
    const empty = document.getElementById('histEmpty');
    const wrap  = document.getElementById('histWrap');
    tbody.innerHTML = '';

    if (!Store.history.length) {
      empty.style.display = 'block';
      wrap.style.display  = 'none';
      return;
    }
    empty.style.display = 'none';
    wrap.style.display  = 'block';

    Store.history.forEach(rec => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="inv-num">${escHtml(rec.number || '—')}</td>
        <td style="font-weight:700">${escHtml(rec.customer?.name || rec.customer || '—')}</td>
        <td><span class="pill pill-type">${escHtml(rec.type || '—')}</span></td>
        <td>${escHtml(rec.date || '—')}</td>
        <td class="h-amt">${fmt(rec.total)}</td>
        <td>
          <div class="h-acts">
            <button class="btn-hs bprint" onclick="Hist.reprint(${rec.id})" title="Print">🖨️</button>
            <button class="btn-hs bpdf"   onclick="Hist.repdf(${rec.id})"   title="PDF">📄 PDF</button>
            <button class="btn-hs bedit"  onclick="Hist.openEdit(${rec.id})" title="Edit">✏️</button>
            <button class="btn-hs bdel"   onclick="Hist.del(${rec.id})"     title="Futa">🗑️</button>
          </div>
        </td>`;
      tbody.appendChild(tr);
    });
  },

  reprint(id) { const rec = Store.history.find(h => h.id === id); if (rec) Docs.reprint(rec); },
  repdf(id)   { const rec = Store.history.find(h => h.id === id); if (rec) Docs.repdf(rec); },

  del(id) {
    if (!confirm('Futa invoice hii?')) return;
    Store.remove(id);
    this.render();
    UI.updateBadge();
    toast('🗑️ Imefutwa!', 'success');
  },

  clearAll() {
    if (!confirm('Futa records ZOTE? Haiwezi kutenduliwa!')) return;
    Store.clear();
    this.render();
    UI.updateBadge();
    toast('🗑️ History yote imefutwa!', 'success');
  },

  openEdit(id) {
    const rec = Store.history.find(h => h.id === id);
    if (!rec) return;
    this._editId = id;
    const cust = rec.customer || {};
    document.getElementById('e_name').value     = cust.name     || rec.customer || '';
    document.getElementById('e_contact').value  = cust.contact  || '';
    document.getElementById('e_location').value = cust.location || '';
    document.getElementById('e_number').value   = rec.number    || '';
    document.getElementById('e_date').value     = rec.date      || '';
    document.getElementById('e_title').value    = rec.title     || '';
    document.getElementById('e_type').value     = rec.type      || 'PROFORMA INVOICE';
    document.getElementById('editModal').style.display = 'flex';
  },

  saveEdit() {
    if (!this._editId) return;
    const name = document.getElementById('e_name').value.trim();
    if (!name) { toast('⚠️ Jina la mteja haliwezi kuwa wazi!', 'error'); return; }
    const patch = {
      customer: {
        name:     name,
        contact:  document.getElementById('e_contact').value.trim(),
        location: document.getElementById('e_location').value.trim(),
      },
      number: document.getElementById('e_number').value.trim(),
      date:   document.getElementById('e_date').value,
      title:  document.getElementById('e_title').value.trim(),
      type:   document.getElementById('e_type').value,
    };
    Store.update(this._editId, patch);
    this.render();
    this.closeEdit();
    toast('✅ Invoice imehaririwa!', 'success');
  },

  closeEdit() {
    document.getElementById('editModal').style.display = 'none';
    this._editId = null;
  }
};

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
function fmt(n) {
  return new Intl.NumberFormat('en-TZ').format(parseFloat(n) || 0);
}
function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/* ══════════════════════════════════════════════════════════
   KEYBOARD SHORTCUTS
══════════════════════════════════════════════════════════ */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    Hist.closeEdit();
    UI.closeSidebar();
  }
});
document.getElementById('editModal').addEventListener('click', function(e) {
  if (e.target === this) Hist.closeEdit();
});

/* ══════════════════════════════════════════════════════════
   BANK SETTINGS (Admin sets account details in CONFIG at top)
   These appear in invoices automatically once set.
══════════════════════════════════════════════════════════ */
