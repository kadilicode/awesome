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

  /* Kila huduma ni item yake — separators zinawekwa na code,
     hivyo maneno hayagongani kwenye PDF. */
  services: [
    'CCTV Cameras Installation',
    'Electric Fence',
    'Installation of Car GPS Tracker System',
    'Access Control Systems',
    'Video Intercoms',
    'Networking & Internet Services',
  ],

  /* ── RANGI ZA BRAND (blue + nyekundu, kutoka kwenye logo) ──
     Hizi hutumika kwenye PDF na Word. Zibadilishe hapa tu.   */
  colors: {
    blue:     '#0b2e6f',
    blueMid:  '#10409b',
    blueSoft: '#1d5bd6',
    red:      '#d6202b',
    redDark:  '#a9161f',
  },

  /* Default za malipo — zinajazwa kwenye form, na
     zinahifadhiwa kiotomatiki ukiweka tick ya "Kumbuka". */
  payDefaultsKey: 'awesome_v1_paydefaults',
  payment: {
    method: 'bank',
    bank: { name: 'CRDB BANK', accountNo: '', accountName: '' },
    lipa: { network: 'M-PESA (Vodacom)', number: '', name: '' },
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
    Pay.loadDefaults();
    Rows.add();
  }
};

/* ══════════════════════════════════════════════════════════
   PAY — Payment method (Bank Account / Lipa Namba)
══════════════════════════════════════════════════════════ */
const Pay = {

  /* Onyesha/ficha boxes kulingana na chaguo la mtumiaji */
  toggle() {
    const m = document.getElementById('pay_method').value;
    document.getElementById('payBankBox').style.display =
      (m === 'bank' || m === 'both') ? 'block' : 'none';
    document.getElementById('payLipaBox').style.display =
      (m === 'lipa' || m === 'both') ? 'block' : 'none';
  },

  toggleEdit() {
    const m = document.getElementById('e_pay_method').value;
    document.getElementById('ePayBankBox').style.display =
      (m === 'bank' || m === 'both') ? 'block' : 'none';
    document.getElementById('ePayLipaBox').style.display =
      (m === 'lipa' || m === 'both') ? 'block' : 'none';
  },

  /* Soma taarifa za malipo kutoka kwenye form kuu */
  read() {
    return {
      method: document.getElementById('pay_method').value,
      bank: {
        name:        document.getElementById('pay_bank_name').value.trim(),
        accountNo:   document.getElementById('pay_bank_acc').value.trim(),
        accountName: document.getElementById('pay_bank_holder').value.trim(),
      },
      lipa: {
        network: document.getElementById('pay_lipa_network').value,
        number:  document.getElementById('pay_lipa_no').value.trim(),
        name:    document.getElementById('pay_lipa_name').value.trim(),
      },
    };
  },

  /* Soma kutoka kwenye edit modal */
  readEdit() {
    return {
      method: document.getElementById('e_pay_method').value,
      bank: {
        name:        document.getElementById('e_bank_name').value.trim(),
        accountNo:   document.getElementById('e_bank_acc').value.trim(),
        accountName: document.getElementById('e_bank_holder').value.trim(),
      },
      lipa: {
        network: document.getElementById('e_lipa_network').value,
        number:  document.getElementById('e_lipa_no').value.trim(),
        name:    document.getElementById('e_lipa_name').value.trim(),
      },
    };
  },

  /* Jaza edit modal kwa taarifa za invoice husika */
  fillEdit(pay) {
    const p = this._normalize(pay);
    document.getElementById('e_pay_method').value   = p.method;
    document.getElementById('e_bank_name').value    = p.bank.name;
    document.getElementById('e_bank_acc').value     = p.bank.accountNo;
    document.getElementById('e_bank_holder').value  = p.bank.accountName;
    document.getElementById('e_lipa_network').value = p.lipa.network;
    document.getElementById('e_lipa_no').value      = p.lipa.number;
    document.getElementById('e_lipa_name').value    = p.lipa.name;
    this.toggleEdit();
  },

  /* Hifadhi defaults ili usiandike upya kila invoice */
  saveDefaults(pay) {
    if (!document.getElementById('pay_remember').checked) return;
    try { localStorage.setItem(CONFIG.payDefaultsKey, JSON.stringify(pay)); }
    catch (e) { /* storage imejaa — puuza */ }
  },

  loadDefaults() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(CONFIG.payDefaultsKey) || 'null'); }
    catch (e) { saved = null; }
    const p = this._normalize(saved || CONFIG.payment);

    document.getElementById('pay_method').value        = p.method;
    document.getElementById('pay_bank_name').value     = p.bank.name;
    document.getElementById('pay_bank_acc').value      = p.bank.accountNo;
    document.getElementById('pay_bank_holder').value   = p.bank.accountName;
    document.getElementById('pay_lipa_network').value  = p.lipa.network;
    document.getElementById('pay_lipa_no').value       = p.lipa.number;
    document.getElementById('pay_lipa_name').value     = p.lipa.name;
    this.toggle();
  },

  /* Invoice za zamani hazina .payment — hapa tunazipa muundo sahihi */
  _normalize(pay) {
    const d = CONFIG.payment;
    const p = pay || {};
    return {
      method: p.method || 'bank',
      bank: {
        name:        (p.bank && p.bank.name)        || d.bank.name,
        accountNo:   (p.bank && p.bank.accountNo)   || '',
        accountName: (p.bank && p.bank.accountName) || '',
      },
      lipa: {
        network: (p.lipa && p.lipa.network) || d.lipa.network,
        number:  (p.lipa && p.lipa.number)  || '',
        name:    (p.lipa && p.lipa.name)    || '',
      },
    };
  },

  /* Sehemu za kuonyesha — hutumika na PDF, Print na Word */
  blocks(pay) {
    const p    = this._normalize(pay);
    const out  = [];
    const dash = '\u2014';
    if (p.method === 'bank' || p.method === 'both') {
      out.push({
        kind:  'bank',
        title: p.bank.name || 'BANK ACCOUNT',
        lines: [
          ['Account No',   p.bank.accountNo   || dash],
          ['Account Name', p.bank.accountName || dash],
        ],
      });
    }
    if (p.method === 'lipa' || p.method === 'both') {
      out.push({
        kind:  'lipa',
        title: p.lipa.network || 'LIPA NAMBA',
        lines: [
          ['Lipa Namba', p.lipa.number || dash],
          ['Jina',       p.lipa.name   || dash],
        ],
      });
    }
    return out;
  },
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
      payment:     Pay.read(),
    };
  },

  save(action) {
    const rec = this._collect();
    if (!rec) return;

    Store.push(rec);
    Pay.saveDefaults(rec.payment);
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

    const payCards = Pay.blocks(rec.payment).map(b => `
      <div class="pz-bank ${b.kind}">
        <div class="bn">${b.kind === 'lipa' ? '&#128241;' : '&#127974;'} ${escHtml(b.title)}</div>
        ${b.lines.map(l => `<div class="ba">${escHtml(l[0])}: <b>${escHtml(l[1])}</b></div>`).join('')}
      </div>`).join('');

    const paySection = `
      <div class="pz-pay">
        <div class="pz-pay-title">&#128179; PAYMENT METHOD / NAMNA YA MALIPO</div>
        <table class="pz-pay-cols">
          <tr>
            <td class="pz-pay-left" style="width:58%;vertical-align:top">
              ${payCards}
            </td>
            <td style="width:42%;vertical-align:top;padding-left:14px">
              <span class="pz-col-label">&#128231; CONTACT</span>
              <div style="font-size:11px;color:#334155;line-height:1.8">
                <div>&#128222; ${escHtml(c.phone1)} / ${escHtml(c.phone2)}</div>
                <div>&#9993; ${escHtml(c.email)}</div>
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
        ${CONFIG.services.map(sv =>
          `<span class="dot">&#9679;</span>&nbsp;${escHtml(sv)}&nbsp;&nbsp;`
        ).join('')}
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
          <td class="pz-align-right" style="width:24%;padding:6px 11px;font-size:12px;font-weight:700;color:#334155;text-align:right">${fmt(subtotal)}</td>
        </tr>
        ${labourRow}
        <tr class="pz-grand-row">
          <td colspan="3" class="grand-label">GRAND TOTAL (TZS)</td>
          <td class="grand-value" style="width:24%">
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
        font-family: Arial, Helvetica, sans-serif !important;
        letter-spacing: normal !important;
        word-spacing: normal !important;
      }
      #printZone p, #printZone span, #printZone div,
      #printZone td, #printZone th { color: #0b2e6f !important; }
      #printZone .pz-footer p, #printZone .pz-brand-txt p,
      #printZone .pz-contact p, #printZone .pz-bank .ba,
      #printZone .pz-bank .bh { color: #1e293b !important; }
      #printZone .pz-services-banner,
      #printZone .pz-services-banner span:not(.dot) {
        color: #ffffff !important;
        background: #0b2e6f !important;
      }
      #printZone .pz-services-banner .dot,
      #printZone .company,
      #printZone .tagline,
      #printZone .pz-bank.lipa .bn,
      #printZone .pz-bank.lipa .ba b { color: #d6202b !important; }
      #printZone .pz-table th {
        background: #0b2e6f !important; color: #fff !important;
      }
      #printZone .pz-grand-row .grand-label {
        background: #0b2e6f !important; color: #fff !important;
      }
      #printZone .pz-grand-row .grand-value,
      #printZone .pz-grand-row .grand-value .pz-total-big {
        background: #d6202b !important; color: #fff !important;
      }
      #printZone .pz-bank .bn { color: #0b2e6f !important; }
      #printZone .pz-bank .ba b { color: #0b2e6f !important; }
    `;
    document.head.appendChild(pdfStyle);

    try {
      // Subiri fonts na logo vipakie kabisa kabla ya kupiga picha.
      // Bila hii, html2canvas hupima maneno vibaya na yanagongana.
      if (document.fonts && document.fonts.ready) {
        try { await document.fonts.ready; } catch (e) { /* puuza */ }
      }
      await Promise.all(
        Array.from(pz.querySelectorAll('img')).map(img =>
          img.complete ? Promise.resolve()
                       : new Promise(r => { img.onload = img.onerror = r; })
        )
      );
      await sleep(450);
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

    const payRowsW = Pay.blocks(rec.payment).map(b => {
      const accent = b.kind === 'lipa' ? '#d6202b' : '#0b2e6f';
      return `
      <tr>
        <td style="border:1px solid #dbe3f0;border-left:4px solid ${accent};padding:12px;background:#f5f8ff">
          <strong style="font-size:13px;color:${accent}">${escHtml(b.title)}</strong><br>
          ${b.lines.map(l =>
            `<span style="font-size:12px;color:#1e293b">${escHtml(l[0])}: <b style="color:${accent}">${escHtml(l[1])}</b></span>`
          ).join('<br>')}
        </td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>body{font-family:Calibri,Arial,sans-serif;color:#0b2e6f;padding:22px;font-size:13px}</style>
</head><body>
<table style="width:100%;border-bottom:4px solid #d6202b;padding-bottom:12px;margin-bottom:10px">
  <tr>
    <td>
      <h1 style="font-size:18px;font-weight:900;color:#0b2e6f;margin:0 0 2px;letter-spacing:1px">
        ${escHtml(c.name)}
      </h1>
      <p style="font-size:11px;font-style:italic;color:#d6202b;margin:0 0 4px;font-weight:600">
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

<div style="background:#0b2e6f;color:#fff;padding:10px 16px;border-radius:6px;font-size:11px;font-weight:600;margin-bottom:12px;line-height:1.7">
  ${CONFIG.services.map(sv => escHtml(sv)).join(' &nbsp;&bull;&nbsp; ')}
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
    <tr style="background:#0b2e6f;color:#fff">
      <th style="border:1.5px solid #0b2e6f;padding:9px;width:9%;font-size:11px">Qty</th>
      <th style="border:1.5px solid #0b2e6f;padding:9px;font-size:11px">Description / Maelezo</th>
      <th style="border:1.5px solid #0b2e6f;padding:9px;width:20%;text-align:right;font-size:11px">Price per Item (TZS)</th>
      <th style="border:1.5px solid #0b2e6f;padding:9px;width:18%;text-align:right;font-size:11px">Amount (TZS)</th>
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
  <tr>
    <td colspan="3" style="background:#0b2e6f;color:#fff;padding:11px 10px;font-weight:800;font-size:13px;text-transform:uppercase;letter-spacing:1px">GRAND TOTAL (TZS)</td>
    <td style="background:#d6202b;color:#fff;padding:11px 10px;text-align:right;white-space:nowrap">
      <span style="font-size:19px;font-weight:900;color:#ffffff">${fmt(grand)}</span>
    </td>
  </tr>
</table>

<h3 style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#0b2e6f;margin-top:20px;padding-top:14px;border-top:2px solid #e2e8f0;margin-bottom:8px">
  💳 PAYMENT METHOD
</h3>
<table style="width:55%;border-collapse:collapse;margin-bottom:10px">
  ${payRowsW}
</table>

<div style="margin-top:20px;border-top:2px solid #e2e8f0;padding-top:12px;text-align:center">
  <p style="font-size:15px;font-weight:900;color:#0b2e6f;margin:0 0 3px">${escHtml(f.thanks)}</p>
  <p style="font-size:13px;font-weight:700;color:#d6202b;letter-spacing:1px;margin:0 0 2px">${escHtml(f.company)}</p>
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
    Pay.fillEdit(rec.payment);
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
      payment: Pay.readEdit(),
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
   PAYMENT SETTINGS
   Taarifa za malipo sasa zinajazwa moja kwa moja kwenye form
   ya invoice (Bank Account / Lipa Namba / Zote Mbili).
   Ukiweka tick ya "Kumbuka taarifa hizi", zinahifadhiwa
   kwenye kifaa na kujaza zenyewe kwenye invoice zijazo.
   Default za mwanzo zipo kwenye CONFIG.payment juu.
══════════════════════════════════════════════════════════ */
