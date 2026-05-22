import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Package, ArrowLeft, ArrowRight, CheckCircle2, Anchor, Plane, Truck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { quotationRequestAPI } from '../api';

// ── Service Matrix Helper Logic ──────────────────────────────────────────────
const needsPickup    = (scope) => scope.startsWith('d2');   // d2d, d2p
const needsDelivery  = (scope) => scope.endsWith('2d');     // d2d, p2d
const needsOriginPort= (scope) => scope.startsWith('p2');   // p2p, p2d
const needsDestPort  = (scope) => scope.endsWith('2p');     // d2p, p2p

const SEA_PORTS = [
  'IDTPP – Tanjung Priok, Jakarta',
  'IDTPE – Tanjung Perak, Surabaya',
  'IDBLW – Belawan, Medan',
  'IDSRG – Tanjung Emas, Semarang',
  'IDBPN – Kariangau, Balikpapan',
  'IDMKQ – Makassar New Port, Makassar',
  'IDBTH – Batu Ampar, Batam',
  'IDPNK – Dwikora, Pontianak',
  'IDMDC – Bitung, Manado',
  'IDAMQ – Yos Sudarso, Ambon',
  'IDJOG – Kulon Progo (Yogyakarta)',
  'IDPLM – Boom Baru, Palembang',
  'IDPKB – Teluk Bayur, Padang',
];

const AIR_PORTS = [
  'CGK – Soekarno-Hatta, Jakarta',
  'SUB – Juanda, Surabaya',
  'KNO – Kualanamu, Medan',
  'DPS – Ngurah Rai, Bali',
  'UPG – Sultan Hasanuddin, Makassar',
  'BPN – Sultan Aji Muhammad Sulaiman, Balikpapan',
  'PLM – Sultan Mahmud Badaruddin II, Palembang',
  'PDG – Minangkabau, Padang',
  'SOC – Adisumarmo, Solo',
  'JOG – Yogyakarta International',
  'PKY – Tjilik Riwut, Palangkaraya',
  'PNK – Supadio, Pontianak',
  'MDC – Sam Ratulangi, Manado',
  'AMQ – Pattimura, Ambon',
  'BTH – Hang Nadim, Batam',
];

const ID_CITIES = [
  'Jakarta Pusat','Jakarta Utara','Jakarta Barat','Jakarta Selatan','Jakarta Timur',
  'Bogor','Depok','Tangerang','Tangerang Selatan','Bekasi','Karawang','Cikarang',
  'Bandung','Cimahi','Cirebon','Tasikmalaya','Garut','Sukabumi',
  'Surabaya','Sidoarjo','Gresik','Malang','Batu','Jember','Kediri','Madiun','Mojokerto',
  'Semarang','Solo','Salatiga','Magelang','Purwokerto','Pekalongan','Tegal',
  'Yogyakarta','Sleman','Bantul','Kulon Progo','Gunungkidul',
  'Medan','Deli Serdang','Binjai','Pematangsiantar','Tebing Tinggi',
  'Palembang','Prabumulih','Lubuklinggau','Baturaja',
  'Makassar','Gowa','Maros','Takalar','Bone','Parepare',
  'Balikpapan','Samarinda','Bontang','Kutai Kartanegara',
  'Banjarmasin','Banjarbaru','Martapura',
  'Pontianak','Singkawang','Ketapang',
  'Padang','Bukittinggi','Payakumbuh','Pekanbaru','Dumai',
  'Batam','Tanjung Pinang',
  'Denpasar','Badung','Gianyar','Tabanan',
  'Mataram','Lombok Tengah','Sumbawa',
  'Kupang','Ende','Maumere',
  'Manado','Bitung','Kotamobagu',
  'Ambon','Ternate','Sorong','Jayapura','Merauke','Timika',
  'Banda Aceh','Langsa','Lhokseumawe',
  'Jambi','Muara Bungo',
  'Bengkulu','Palangkaraya','Mamuju','Kendari','Palu',
];

const fieldClass = "w-full px-4 py-3 bg-white border border-slate-200 rounded-md focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all text-sm font-medium text-slate-900";
const labelClass = "block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2";

// Searchable combobox — user types to filter but MUST select from list
function LocationSelect({ label, id, options, placeholder, required, value, onChange }) {
  const [query, setQuery] = useState(value || '');
  const [open, setOpen]   = useState(false);

  const filtered = options
    .filter(o => o.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 12);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  const handleSelect = (opt) => {
    setQuery(opt);
    onChange(opt);
    setOpen(false);
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (options.includes(query)) {
        onChange(query);
      } else {
        if (!value) setQuery('');
        else setQuery(value);
      }
      setOpen(false);
    }, 180);
  };

  return (
    <div className="relative">
      <label className={labelClass}>{label}</label>
      <input
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); onChange(''); }}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        autoComplete="off"
        className={`${fieldClass} pr-10`}
      />
      <input type="hidden" value={value} required={required} />
      <div className="pointer-events-none absolute right-4 top-9 text-slate-400">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full bg-white border border-slate-200 shadow-lg rounded-md mt-1 max-h-52 overflow-y-auto" style={{ top: '100%' }}>
          {filtered.map(opt => (
            <button key={opt} type="button"
              onMouseDown={() => handleSelect(opt)}
              className={`w-full text-left px-4 py-3 text-sm border-b border-slate-100 last:border-0 transition-colors ${
                opt === value ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-800'
              }`}>
              {opt}
            </button>
          ))}
        </div>
      )}
      {value && (
        <p className="text-xs text-blue-600 font-semibold mt-1">
          ✓ Terpilih: {value}
        </p>
      )}
    </div>
  );
}

function PartyBlock({ title, checkLabel, prefix, formData, onChange, user }) {
  const isSame = formData[`${prefix}_same_as_client`];
  const clientName = user
    ? (user.company_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email)
    : '';
  const clientPic = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '';
  const clientPhone = user ? user.phone || '' : '';
  const clientEmail = user ? user.email || '' : '';

  const handleCheckboxChange = (checked) => {
    onChange(`${prefix}_same_as_client`, checked);
    if (checked) {
      onChange(`${prefix}_company`, clientName);
      onChange(`${prefix}_pic`, clientPic);
      onChange(`${prefix}_phone`, clientPhone);
      onChange(`${prefix}_email`, clientEmail);
    } else {
      onChange(`${prefix}_company`, '');
      onChange(`${prefix}_pic`, '');
      onChange(`${prefix}_phone`, '');
      onChange(`${prefix}_email`, '');
    }
  };

  return (
    <div className="space-y-3 pt-4 border-t border-slate-100 mt-4">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-700">{title}</p>
      {user && (
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isSame}
            onChange={e => handleCheckboxChange(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="font-semibold text-slate-700">{checkLabel}</span>
        </label>
      )}
      <div className="space-y-3">
        <input
          required
          type="text"
          value={formData[`${prefix}_company`] || ''}
          onChange={e => onChange(`${prefix}_company`, e.target.value)}
          disabled={isSame}
          placeholder="Nama Perusahaan / Kontak Utama *"
          className={`${fieldClass} ${isSame ? 'bg-slate-50 text-slate-500 font-semibold cursor-not-allowed border-slate-100' : ''}`}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            required
            type="text"
            value={formData[`${prefix}_pic`] || ''}
            onChange={e => onChange(`${prefix}_pic`, e.target.value)}
            disabled={isSame}
            placeholder="PIC / Nama Kontak *"
            className={`${fieldClass} ${isSame ? 'bg-slate-50 text-slate-500 font-semibold cursor-not-allowed border-slate-100' : ''}`}
          />
          <input
            required
            type="tel"
            value={formData[`${prefix}_phone`] || ''}
            onChange={e => onChange(`${prefix}_phone`, e.target.value)}
            disabled={isSame}
            placeholder="No. Telp / WhatsApp *"
            className={`${fieldClass} ${isSame ? 'bg-slate-50 text-slate-500 font-semibold cursor-not-allowed border-slate-100' : ''}`}
          />
        </div>
      </div>
    </div>
  );
}

function RoutingStep({ formData, onChange, user }) {
  const mode        = formData.mode;
  const scope       = formData.scope;
  const ports       = mode === 'air' ? AIR_PORTS : SEA_PORTS;
  const polLabel    = mode === 'air' ? 'Bandara Asal (Origin Airport) *' : 'Pelabuhan Asal (Port of Loading) *';
  const podLabel    = mode === 'air' ? 'Bandara Tujuan (Destination Airport) *' : 'Pelabuhan Tujuan (Port of Discharge) *';

  const [tab, setTab] = useState('origin');

  const showPort   = mode !== 'land';
  const showPickup = needsPickup(scope);
  const showDeliv  = needsDelivery(scope);
  const isOrigin   = tab === 'origin';

  // current tab values
  const portVal    = isOrigin ? formData.pol : formData.pod;
  const setPort    = (val) => {
    if (isOrigin) {
      onChange('pol', val);
      if (val) onChange('pol_name', val.split(' – ')[1] || val);
    } else {
      onChange('pod', val);
      if (val) onChange('pod_name', val.split(' – ')[1] || val);
    }
  };

  const cityVal    = isOrigin ? formData.pickup_city : formData.delivery_city;
  const setCity    = (val) => {
    if (isOrigin) onChange('pickup_city', val);
    else onChange('delivery_city', val);
  };

  const addressVal = isOrigin ? formData.pickup_address : formData.delivery_address;
  const setAddress = (val) => {
    if (isOrigin) onChange('pickup_address', val);
    else onChange('delivery_address', val);
  };

  const portLabelText = isOrigin ? polLabel : podLabel;
  const showAddr   = isOrigin ? showPickup : showDeliv;
  const prefix     = isOrigin ? 'shipper' : 'consignee';
  const partyTitle = isOrigin ? 'Detail Pengirim (Shipper) *' : 'Detail Penerima (Consignee) *';
  const partyCheck = isOrigin ? 'Saya / Perusahaan Saya adalah Pengirim' : 'Saya / Perusahaan Saya adalah Penerima';
  const addrHint   = isOrigin
    ? 'Cth. Jl. Batu Ratna 2 No.22 Jakarta 13520'
    : 'Cth. Jl. Merdeka No.1 Surabaya 60232';
  const locHint    = isOrigin
    ? 'Petunjuk lokasi (opsional) — Cth. Gudang Blok C, sebelah Alfamart'
    : 'Petunjuk lokasi (opsional) — Cth. Pabrik lt.2, hubungi Pak Budi';

  const tabs = [
    { id: 'origin',      icon: '📍', label: mode === 'land' ? 'Origin / Penjemputan' : `Origin` },
    { id: 'destination', icon: '🏁', label: mode === 'land' ? 'Destination / Pengiriman' : `Destination` },
  ];

  return (
    <div className="animate-fade-in-up space-y-4">
      {/* ── Tab Switcher (soft underline style) ── */}
      <div className="flex border-b border-slate-200">
        {tabs.map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-5 py-3 text-sm font-bold transition-all border-b-2 -mb-px ${
              tab === t.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
        {/* Route summary pill */}
        {(formData.pol || formData.pickup_city) && (formData.pod || formData.delivery_city) && (
          <span className="ml-auto self-center text-xs text-slate-500 pr-1">
            {(formData.pol || formData.pickup_city).split(' – ')[0].trim()} →{' '}
            {(formData.pod || formData.delivery_city).split(' – ')[0].trim()}
          </span>
        )}
      </div>

      {/* ── Panel ── */}
      <div className="space-y-4 pt-2">
        {/* Port / Airport lookup */}
        {showPort && (
          <LocationSelect
            label={portLabelText}
            id={`${tab}-port`}
            options={ports}
            placeholder={mode === 'air' ? 'Cari bandara...' : 'Cari pelabuhan...'}
            required
            value={portVal}
            onChange={setPort}
          />
        )}

        {/* Land — City lookup */}
        {mode === 'land' && (
          <LocationSelect
            label={isOrigin ? 'Kota / Area Asal *' : 'Kota / Area Tujuan *'}
            id={`${tab}-city`}
            options={ID_CITIES}
            placeholder={isOrigin ? 'Cth: Bekasi, Cikarang...' : 'Cth: Surabaya, Sidoarjo...'}
            required
            value={cityVal}
            onChange={setCity}
          />
        )}

        {/* Address (only if Door scope for this side) */}
        {showAddr && (
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">
                {isOrigin ? 'Pickup Address *' : 'Delivery Address *'}
              </p>
              <div className="relative">
                <input
                  required
                  type="text"
                  value={addressVal || ''}
                  onChange={e => setAddress(e.target.value)}
                  placeholder={`Jalan + Kota + Kode Pos — ${addrHint}`}
                  className={`${fieldClass} pr-32 text-sm`}
                />
                <button type="button"
                  className="absolute right-0 top-0 h-full px-3 bg-slate-50 border-l border-slate-200 text-xs text-slate-400 flex items-center gap-1 cursor-not-allowed rounded-r-md">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Pin Map
                  <span className="text-[9px] bg-slate-200 text-slate-600 px-1 rounded-sm font-bold">soon</span>
                </button>
              </div>
            </div>
            
            {/* Party Contact details */}
            <PartyBlock
              title={partyTitle}
              checkLabel={partyCheck}
              prefix={prefix}
              formData={formData}
              onChange={onChange}
              user={user}
            />
          </div>
        )}

        {/* Navigation hint */}
        {tab === 'origin' && (
          <button type="button" onClick={() => setTab('destination')}
            className="w-full text-center text-xs font-bold text-blue-600 hover:text-blue-800 pt-2 flex items-center justify-center gap-1">
            Lanjut ke Lokasi Tujuan →
          </button>
        )}
      </div>
    </div>
  );
}

function CargoStep({ formData, onChange }) {
  const mode    = formData.mode;
  const seaType = formData.sea_type;

  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-6">
          <label className={labelClass}>Komoditas / Nama Barang *</label>
          <input
            required
            type="text"
            value={formData.commodity || ''}
            onChange={e => onChange('commodity', e.target.value)}
            placeholder="Cth: Komponen Elektronik, Garment, Ban..."
            className={fieldClass}
          />
        </div>
        <div className="md:col-span-3">
          <label className={labelClass}>HS Code <span className="font-normal text-slate-400">(opsional)</span></label>
          <input
            type="text"
            value={formData.hs_code || ''}
            onChange={e => onChange('hs_code', e.target.value)}
            placeholder="Cth: 8542.31"
            className={fieldClass}
          />
        </div>
        <div className="md:col-span-3">
          <label className={labelClass}>Barang Berbahaya? (Hazmat)</label>
          <select
            value={formData.is_dangerous ? 'YES' : 'NO'}
            onChange={e => {
              const yes = e.target.value === 'YES';
              onChange('is_dangerous', yes);
              if (!yes) onChange('dg_class', '');
            }}
            className={fieldClass + " font-bold"}
          >
            <option value="NO">❌ Tidak (Umum)</option>
            <option value="YES">⚠️ Ya (DG / dangerous goods)</option>
          </select>
        </div>
      </div>

      {formData.is_dangerous && (
        <div className="animate-fade-in-up md:grid md:grid-cols-12 gap-4">
          <div className="md:col-span-12">
            <label className={labelClass}>IMDG/IATA Kelas Barang Berbahaya *</label>
            <input
              required
              type="text"
              value={formData.dg_class || ''}
              onChange={e => onChange('dg_class', e.target.value)}
              placeholder="Cth: Class 3 - Flammable Liquid, UN 1263"
              className={fieldClass}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-6">
          <label className={labelClass}>Nilai Kargo <span className="font-normal text-slate-400">(untuk asuransi)</span></label>
          <div className="flex gap-2">
            <select
              value={formData.cargo_currency || 'USD'}
              onChange={e => onChange('cargo_currency', e.target.value)}
              className={fieldClass + " w-28 font-bold"}
            >
              <option value="USD">USD</option>
              <option value="IDR">IDR</option>
              <option value="SGD">SGD</option>
            </select>
            <input
              type="number"
              value={formData.cargo_value || ''}
              onChange={e => onChange('cargo_value', e.target.value)}
              placeholder="Cth: 50000"
              className={fieldClass}
            />
          </div>
        </div>
        <div className="md:col-span-3">
          <label className={labelClass}>Target ETD <span className="font-normal text-slate-400">(opsional)</span></label>
          <input
            type="date"
            value={formData.target_etd || ''}
            onChange={e => onChange('target_etd', e.target.value)}
            className={fieldClass}
          />
        </div>
        <div className="md:col-span-3">
          <label className={labelClass}>Incoterms</label>
          <select
            value={formData.incoterms || ''}
            onChange={e => onChange('incoterms', e.target.value)}
            className={fieldClass + " font-medium"}
          >
            <option value="">— Select —</option>
            {['EXW','FCA','FOB','CFR','CIF','DAP','DDP','CPT','CIP'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {mode === 'sea' && (
        <div className="bg-slate-50 p-5 border border-slate-200 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3">
              <label className={labelClass}>Tipe Ocean Freight</label>
              <select
                value={seaType}
                onChange={e => {
                  onChange('sea_type', e.target.value);
                  if (e.target.value === 'FCL') {
                    onChange('package_qty', '');
                    onChange('gross_weight', '');
                    onChange('volume_cbm', '');
                  } else {
                    onChange('container_size', '');
                    onChange('container_qty', '');
                    onChange('container_weight', '');
                  }
                }}
                className={fieldClass + " font-bold"}
              >
                <option value="FCL">FCL – Full Container</option>
                <option value="LCL">LCL – Less than Container</option>
              </select>
            </div>
            {seaType === 'FCL' && (
              <>
                <div className="md:col-span-3">
                  <label className={labelClass}>Ukuran Kontainer *</label>
                  <select
                    required
                    value={formData.container_size || ''}
                    onChange={e => onChange('container_size', e.target.value)}
                    className={fieldClass + " font-bold"}
                  >
                    <option value="">Select</option>
                    <option value="20GP">20' GP Standard</option>
                    <option value="40GP">40' GP Standard</option>
                    <option value="40HC">40' HC High Cube</option>
                    <option value="20RF">20' RF Reefer</option>
                    <option value="40RF">40' RF Reefer</option>
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className={labelClass}>Jumlah Kontainer *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={formData.container_qty || ''}
                    onChange={e => onChange('container_qty', e.target.value)}
                    placeholder="Cth: 2"
                    className={fieldClass + " font-bold"}
                  />
                </div>
                <div className="md:col-span-3">
                  <label className={labelClass}>Berat / Kontainer (KG)</label>
                  <input
                    type="number"
                    value={formData.container_weight || ''}
                    onChange={e => onChange('container_weight', e.target.value)}
                    placeholder="Cth: 20000"
                    className={fieldClass + " font-bold"}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {(mode === 'air' || mode === 'land' || (mode === 'sea' && seaType === 'LCL')) && (
        <div className="bg-slate-50 p-5 border border-slate-200 rounded-lg">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
            <Package className="w-5 h-5 text-slate-400" /> Pengemasan & Dimensi
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>Jenis Kemasan</label>
              <select
                value={formData.package_type || 'Pallet'}
                onChange={e => onChange('package_type', e.target.value)}
                className={fieldClass}
              >
                <option value="Pallet">Pallet</option>
                <option value="Carton">Karton / Box</option>
                <option value="Crate">Peti Kayu / Crate</option>
                <option value="Drum">Drum / IBC</option>
                <option value="Bag">Karung / Bag</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Jumlah Kemasan *</label>
              <input
                required
                type="number"
                min="1"
                value={formData.package_qty || ''}
                onChange={e => onChange('package_qty', e.target.value)}
                placeholder="Cth: 10"
                className={fieldClass + " font-bold"}
              />
            </div>
            <div>
              <label className={labelClass}>Total Berat Gross (KG) *</label>
              <input
                required
                type="number"
                step="0.01"
                value={formData.gross_weight || ''}
                onChange={e => onChange('gross_weight', e.target.value)}
                placeholder="Cth: 250"
                className={fieldClass + " font-bold"}
              />
            </div>
            <div>
              <label className={labelClass}>Total Volume (CBM) *</label>
              <input
                required
                type="number"
                step="0.001"
                value={formData.volume_cbm || ''}
                onChange={e => onChange('volume_cbm', e.target.value)}
                placeholder="Cth: 1.8"
                className={fieldClass + " font-bold"}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Dimensi per Unit (P × L × T cm)</label>
              <input
                type="text"
                value={formData.dimensions || ''}
                onChange={e => onChange('dimensions', e.target.value)}
                placeholder="Cth: 120 × 80 × 100"
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Bisa Ditumpuk?</label>
              <select
                value={formData.is_stackable ? 'YES' : 'NO'}
                onChange={e => onChange('is_stackable', e.target.value === 'YES')}
                className={fieldClass + " font-bold"}
              >
                <option value="YES">✅ Ya</option>
                <option value="NO">❌ Tidak</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div>
        <label className={labelClass}>Instruksi Khusus <span className="font-normal text-slate-400">(opsional)</span></label>
        <textarea
          value={formData.special_instructions || ''}
          onChange={e => onChange('special_instructions', e.target.value)}
          placeholder="Cth: barang pecah belah, sensitif terhadap suhu, memerlukan penanganan khusus..."
          className={`${fieldClass} h-20 resize-none`}
        />
      </div>
    </div>
  );
}

const SCOPE_OPTIONS = {
  sea:  [['d2d','Door to Door'],['d2p','Door to Port'],['p2p','Port to Port'],['p2d','Port to Door']],
  air:  [['d2d','Door to Door'],['d2p','Door to Airport'],['p2p','Airport to Airport'],['p2d','Airport to Door']],
};

const POINT_TYPES = [
  ['residence', '🏠', 'Perumahan / Residence'],
  ['business',  '🏢', 'Bisnis / Kantor'],
  ['warehouse', '🏭', 'Gudang / Pabrik'],
];

const STEP_TITLES = ['Transportation Service', 'Routing & Parties', 'Cargo Specification Details'];
const STEP_SUBS   = [
  'Select your primary transport mode and logistics service scope.',
  'Define origin, destination, and shipper/consignee contact details.',
  'Provide your cargo specifications for official rate calculation.',
];

export default function RequestQuotePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    mode: 'sea',
    scope: 'd2d',
    sea_type: 'FCL',
    
    pol: '',
    pol_name: '',
    pickup_city: '',
    pickup_address: '',
    pickup_country: 'Indonesia',
    
    pod: '',
    pod_name: '',
    delivery_city: '',
    delivery_address: '',
    delivery_country: 'Indonesia',
    
    shipper_same_as_client: true,
    shipper_company: '',
    shipper_pic: '',
    shipper_phone: '',
    shipper_email: '',
    
    consignee_same_as_client: false,
    consignee_company: '',
    consignee_pic: '',
    consignee_phone: '',
    consignee_email: '',
    
    commodity: '',
    hs_code: '',
    is_dangerous: false,
    dg_class: '',
    incoterms: '',
    cargo_value: '',
    cargo_currency: 'USD',
    target_etd: '',
    special_instructions: '',
    
    container_size: '',
    container_qty: '',
    container_weight: '',
    
    package_type: 'Pallet',
    package_qty: '',
    gross_weight: '',
    volume_cbm: '',
    dimensions: '',
    is_stackable: true,
    
    land_origin_type: 'warehouse',
    land_dest_type: 'warehouse',
    
    cargo_items: [{
      container_size: '',
      container_qty: '',
      container_weight: '',
      package_type: 'Pallet',
      package_qty: '',
      gross_weight: '',
      volume_cbm: '',
      length: '',
      width: '',
      height: '',
      is_stackable: true,
    }],
  });

  // Autofill client data if logged in
  useEffect(() => {
    if (user) {
      const clientName = user.company_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
      setFormData(prev => ({
        ...prev,
        shipper_company: prev.shipper_same_as_client ? clientName : prev.shipper_company,
        shipper_pic: prev.shipper_same_as_client ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : prev.shipper_pic,
        shipper_phone: prev.shipper_same_as_client ? user.phone || '' : prev.shipper_phone,
        shipper_email: prev.shipper_same_as_client ? user.email || '' : prev.shipper_email,
        
        consignee_company: prev.consignee_same_as_client ? clientName : prev.consignee_company,
        consignee_pic: prev.consignee_same_as_client ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : prev.consignee_pic,
        consignee_phone: prev.consignee_same_as_client ? user.phone || '' : prev.consignee_phone,
        consignee_email: prev.consignee_same_as_client ? user.email || '' : prev.consignee_email,
      }));
    }
  }, [user]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const changeMode = (m) => {
    setFormData(prev => ({
      ...prev,
      mode: m,
      scope: 'd2d',
      pol: '',
      pol_name: '',
      pod: '',
      pod_name: '',
      pickup_city: '',
      delivery_city: '',
    }));
  };

  // ── Cargo Items Management ──────────────────────────────────────────────
  const addCargoItem = () => {
    const newItem = {
      container_size: '',
      container_qty: '',
      container_weight: '',
      package_type: 'Pallet',
      package_qty: '',
      gross_weight: '',
      volume_cbm: '',
      length: '',
      width: '',
      height: '',
      is_stackable: true,
    };
    setFormData(prev => ({
      ...prev,
      cargo_items: [...prev.cargo_items, newItem]
    }));
  };

  const removeCargoItem = (index) => {
    setFormData(prev => ({
      ...prev,
      cargo_items: prev.cargo_items.filter((_, i) => i !== index)
    }));
  };

  const updateCargoItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      cargo_items: prev.cargo_items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const prepareSubmitData = (raw) => {
    const data = { ...raw };
    
    // Clean numbers
    if (data.cargo_value) data.cargo_value = parseFloat(data.cargo_value);
    else delete data.cargo_value;
    
    if (data.container_qty) data.container_qty = parseInt(data.container_qty, 10);
    else delete data.container_qty;
    
    if (data.container_weight) data.container_weight = parseFloat(data.container_weight);
    else delete data.container_weight;
    
    if (data.package_qty) data.package_qty = parseInt(data.package_qty, 10);
    else delete data.package_qty;
    
    if (data.gross_weight) data.gross_weight = parseFloat(data.gross_weight);
    else delete data.gross_weight;
    
    if (data.volume_cbm) data.volume_cbm = parseFloat(data.volume_cbm);
    else delete data.volume_cbm;
    
    // Clean strings
    if (!data.pol) delete data.pol;
    if (!data.pod) delete data.pod;
    if (!data.pickup_city) delete data.pickup_city;
    if (!data.delivery_city) delete data.delivery_city;
    if (!data.pickup_address) delete data.pickup_address;
    if (!data.delivery_address) delete data.delivery_address;
    if (!data.hs_code) delete data.hs_code;
    if (!data.incoterms) delete data.incoterms;
    if (!data.target_etd) delete data.target_etd;
    if (!data.special_instructions) delete data.special_instructions;
    if (!data.dg_class) delete data.dg_class;

    // Format dimensions to JSON [{l,w,h,qty}]
    if (data.dimensions) {
      try {
        const parts = data.dimensions.toLowerCase().split('×').map(p => p.split('x')).flat().map(p => parseFloat(p.trim()));
        if (parts.length === 3 && !parts.some(isNaN)) {
          data.dimensions = [{
            l: parts[0],
            w: parts[1],
            h: parts[2],
            qty: data.package_qty || 1
          }];
        } else {
          delete data.dimensions;
        }
      } catch {
        delete data.dimensions;
      }
    } else {
      delete data.dimensions;
    }
    
    // Adjust based on mode
    if (data.mode === 'land') {
      delete data.sea_type;
      delete data.pol;
      delete data.pol_name;
      delete data.pod;
      delete data.pod_name;
      data.scope = 'd2d'; // Land trucking always door-to-door conceptually
    } else {
      delete data.land_origin_type;
      delete data.land_dest_type;
    }
    
    // Sync flat cargo fields to cargo_items[0] (for backward compatibility with CargoStep)
    if (data.cargo_items && data.cargo_items.length > 0) {
      // Update first cargo item with flat field values from CargoStep
      data.cargo_items[0] = {
        ...data.cargo_items[0],
        container_size: data.container_size || data.cargo_items[0].container_size,
        container_qty: data.container_qty || data.cargo_items[0].container_qty,
        container_weight: data.container_weight || data.cargo_items[0].container_weight,
        package_type: data.package_type || data.cargo_items[0].package_type,
        package_qty: data.package_qty || data.cargo_items[0].package_qty,
        gross_weight: data.gross_weight || data.cargo_items[0].gross_weight,
        volume_cbm: data.volume_cbm || data.cargo_items[0].volume_cbm,
        is_stackable: data.is_stackable !== undefined ? data.is_stackable : data.cargo_items[0].is_stackable,
      };
    }
    
    // Process cargo_items array
    if (data.cargo_items && data.cargo_items.length > 0) {
      data.cargo_items = data.cargo_items.map(item => {
        const cleanItem = { ...item };
        
        // Clean numeric fields
        if (cleanItem.container_qty) cleanItem.container_qty = parseInt(cleanItem.container_qty, 10);
        if (cleanItem.container_weight) cleanItem.container_weight = parseFloat(cleanItem.container_weight);
        if (cleanItem.package_qty) cleanItem.package_qty = parseInt(cleanItem.package_qty, 10);
        if (cleanItem.gross_weight) cleanItem.gross_weight = parseFloat(cleanItem.gross_weight);
        if (cleanItem.volume_cbm) cleanItem.volume_cbm = parseFloat(cleanItem.volume_cbm);
        if (cleanItem.length) cleanItem.length = parseFloat(cleanItem.length);
        if (cleanItem.width) cleanItem.width = parseFloat(cleanItem.width);
        if (cleanItem.height) cleanItem.height = parseFloat(cleanItem.height);
        
        // Remove empty fields
        Object.keys(cleanItem).forEach(key => {
          if (cleanItem[key] === '' || cleanItem[key] === null || cleanItem[key] === undefined) {
            delete cleanItem[key];
          }
        });
        
        return cleanItem;
      });
    }
    
    return data;
  };

  const handleNext = async (e) => {
    e.preventDefault();
    setError('');

    // Custom client validations per step
    if (step === 2) {
      const mode = formData.mode;
      const scope = formData.scope;
      if (mode !== 'land' && needsOriginPort(scope) && !formData.pol) {
        setError('Silakan pilih Pelabuhan / Bandara Asal yang valid.');
        return;
      }
      if (mode !== 'land' && needsDestPort(scope) && !formData.pod) {
        setError('Silakan pilih Pelabuhan / Bandara Tujuan yang valid.');
        return;
      }
      if (mode === 'land' && !formData.pickup_city) {
        setError('Silakan pilih Kota Asal yang valid.');
        return;
      }
      if (mode === 'land' && !formData.delivery_city) {
        setError('Silakan pilih Kota Tujuan yang valid.');
        return;
      }
      if (needsPickup(scope) && !formData.pickup_address) {
        setError('Please fill in the complete Pickup Address.');
        return;
      }
      if (needsDelivery(scope) && !formData.delivery_address) {
        setError('Please fill in the complete Delivery Address.');
        return;
      }
    }

    if (step < 3) {
      setStep(s => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setLoading(true);
      try {
        const payload = prepareSubmitData(formData);
        
        if (user) {
          // Logged in: submit directly
          await quotationRequestAPI.submit(payload);
          setSubmitted(true);
        } else {
          // Guest: store in localStorage and redirect
          localStorage.setItem('kargopath_pending_quote', JSON.stringify(payload));
          navigate('/register', { state: { quotePending: true } });
        }
      } catch (err) {
        setError(err?.detail || err?.message || 'Gagal mengirimkan permintaan. Silakan periksa kembali formulir Anda.');
      } finally {
        setLoading(false);
      }
    }
  };

  const back = () => {
    if (step > 1) {
      setError('');
      setStep(s => s - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (submitted) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white shadow-xl p-8 text-center border border-slate-100 rounded-lg">
        <div className="w-20 h-20 bg-green-50 flex items-center justify-center mx-auto mb-6 rounded-full">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">Berhasil Dikirim!</h2>
        <p className="text-slate-600 mb-8 leading-relaxed">
          Permintaan penawaran Anda telah masuk ke sistem. Tim sales kami akan segera meninjau dan menghitung tarif terbaik untuk Anda.
        </p>
        <div className="space-y-3">
          <Link to="/dashboard" className="flex items-center justify-center w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all rounded-md">
            Masuk ke Portal & Lacak Penawaran
          </Link>
          <Link to="/" className="block w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all rounded-md">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          {step === 1
            ? <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-sm"><ArrowLeft className="w-4 h-4" /> Beranda</Link>
            : <button type="button" onClick={back} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-sm"><ArrowLeft className="w-4 h-4" /> Kembali</button>}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-md flex items-center justify-center"><Package className="w-4 h-4 text-white" /></div>
            <span className="font-extrabold tracking-tight text-slate-900 hidden sm:block">KargoPath</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Langkah {step} / 3</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-10">
        {/* Progress bar */}
        <div className="flex items-center justify-between mb-10 relative px-4 max-w-xs mx-auto">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-10"></div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 -z-10 transition-all duration-500"
            style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}></div>
          {[1, 2, 3].map(n => (
            <div key={n} className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border-4 border-white transition-all duration-300 shadow-sm ${
              step >= n ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'
            }`}>{n}</div>
          ))}
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">{STEP_TITLES[step - 1]}</h1>
          <p className="text-slate-500 font-medium">{STEP_SUBS[step - 1]}</p>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-md mb-6 text-red-700 animate-fade-in-up">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        )}

        <form onSubmit={handleNext} className="bg-white shadow-md border border-slate-200 rounded-lg overflow-hidden">
          <div className="p-8 md:p-10 min-h-[380px]">
            {/* ── STEP 1 ── */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <label className={labelClass}>Moda Transportasi Utama</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      ['sea', '🚢', 'Sea Freight'],
                      ['air', '✈️', 'Air Freight'],
                      ['land', '🚚', 'Land Trucking']
                    ].map(([v, icon, label]) => (
                      <button key={v} type="button" onClick={() => changeMode(v)}
                        className={`flex flex-col items-center gap-2 py-5 px-3 border-2 rounded-md font-bold text-sm transition-all ${
                          formData.mode === v
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}>
                        <span className="text-2xl">{icon}</span>{label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sea / Air — Scope Selector */}
                {formData.mode !== 'land' && (
                  <div>
                    <label className={labelClass}>Cakupan Layanan (Service Scope)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {SCOPE_OPTIONS[formData.mode].map(([v, label]) => (
                        <button key={v} type="button" onClick={() => handleChange('scope', v)}
                          className={`flex items-center gap-3 p-4 border-2 rounded-md font-semibold text-sm transition-all text-left ${
                            formData.scope === v
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}>
                          <div className={`w-4 h-4 border-2 rounded-full flex-shrink-0 flex items-center justify-center ${
                            formData.scope === v ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                          }`}>
                            {formData.scope === v && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                          {label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-3 flex items-start gap-1.5 font-medium leading-relaxed">
                      <span className="text-blue-500 font-bold">ℹ</span>
                      {formData.scope === 'd2d' && `Kami menangani penjemputan darat di asal, pengapalan utama via ${formData.mode === 'air' ? 'udara' : 'laut'}, dan pengantaran darat ke alamat tujuan.`}
                      {formData.scope === 'd2p' && `Kami menjemput kargo di alamat Anda dan mengirimkannya hingga ke bandara/pelabuhan tujuan saja.`}
                      {formData.scope === 'p2p' && `Anda mengantarkan kargo sendiri ke bandara/pelabuhan asal, dan mengambilnya sendiri di bandara/pelabuhan tujuan.`}
                      {formData.scope === 'p2d' && `Anda mengantarkan kargo ke bandara/pelabuhan asal. Kami menangani pengiriman utama dan pengantaran darat ke alamat tujuan.`}
                    </p>
                  </div>
                )}

                {/* Land Trucking — Point Type Selector */}
                {formData.mode === 'land' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>Tipe Titik Asal (Origin)</label>
                      <div className="space-y-2">
                        {POINT_TYPES.map(([v, icon, label]) => (
                          <button key={v} type="button" onClick={() => handleChange('land_origin_type', v)}
                            className={`w-full flex items-center gap-3 p-4 border-2 rounded-md font-semibold text-sm transition-all text-left ${
                              formData.land_origin_type === v ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}>
                            <span className="text-xl">{icon}</span>{label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Tipe Titik Tujuan (Destination)</label>
                      <div className="space-y-2">
                        {POINT_TYPES.map(([v, icon, label]) => (
                          <button key={v} type="button" onClick={() => handleChange('land_dest_type', v)}
                            className={`w-full flex items-center gap-3 p-4 border-2 rounded-md font-semibold text-sm transition-all text-left ${
                              formData.land_dest_type === v ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}>
                            <span className="text-xl">{icon}</span>{label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && <RoutingStep formData={formData} onChange={handleChange} user={user} />}

            {/* ── STEP 3 ── */}
            {step === 3 && <CargoStep formData={formData} onChange={handleChange} />}

            {/* ── CARGO ITEMS MANAGEMENT ── */}
            {step === 3 && formData.cargo_items && formData.cargo_items.length > 0 && (
              <div className="mt-6 animate-fade-in-up">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      📦 Cargo Items Summary
                      <span className="text-sm font-normal text-slate-500">
                        ({formData.cargo_items.length} {formData.cargo_items.length === 1 ? 'item' : 'items'})
                      </span>
                    </h3>
                    <button
                      type="button"
                      onClick={addCargoItem}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-md transition-all flex items-center gap-2 shadow-sm"
                    >
                      <span className="text-lg">➕</span> Add Cargo Item
                    </button>
                  </div>

                  {/* Cargo Items List */}
                  <div className="space-y-4">
                    {formData.cargo_items.map((item, index) => {
                      const isFCL = formData.sea_type === 'FCL';

                      return (
                        <div
                          key={index}
                          className={`rounded-lg border-2 transition-all ${
                            index === 0
                              ? 'bg-blue-50/50 border-blue-300'
                              : 'bg-white border-slate-300'
                          }`}
                        >
                          {/* Header */}
                          <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                index === 0 ? 'bg-blue-600 text-white' : 'bg-slate-400 text-white'
                              }`}>
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800">
                                  Cargo Item #{index + 1}
                                </p>
                                {index === 0 && (
                                  <p className="text-xs text-blue-600 font-medium">
                                    ⬆️ Managed by form above
                                  </p>
                                )}
                              </div>
                            </div>
                            {index > 0 && (
                              <button
                                type="button"
                                onClick={() => removeCargoItem(index)}
                                className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold text-xs rounded transition-all flex items-center gap-1"
                              >
                                🗑️ Remove
                              </button>
                            )}
                          </div>

                          {/* Editable Form (only for index > 0) */}
                          {index > 0 && (
                            <div className="p-4">
                              {isFCL ? (
                                /* FCL Fields */
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                                      Container Size *
                                    </label>
                                    <select
                                      required
                                      value={item.container_size || ''}
                                      onChange={e => updateCargoItem(index, 'container_size', e.target.value)}
                                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-md focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all text-sm font-medium text-slate-900"
                                    >
                                      <option value="">Select</option>
                                      <option value="20GP">20' GP Standard</option>
                                      <option value="40GP">40' GP Standard</option>
                                      <option value="40HC">40' HC High Cube</option>
                                      <option value="20RF">20' RF Reefer</option>
                                      <option value="40RF">40' RF Reefer</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                                      Quantity *
                                    </label>
                                    <input
                                      required
                                      type="number"
                                      min="1"
                                      value={item.container_qty || ''}
                                      onChange={e => updateCargoItem(index, 'container_qty', e.target.value)}
                                      placeholder="Cth: 2"
                                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-md focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all text-sm font-medium text-slate-900"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                                      Weight/Container (KG)
                                    </label>
                                    <input
                                      type="number"
                                      value={item.container_weight || ''}
                                      onChange={e => updateCargoItem(index, 'container_weight', e.target.value)}
                                      placeholder="Cth: 20000"
                                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-md focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all text-sm font-medium text-slate-900"
                                    />
                                  </div>
                                </div>
                              ) : (
                                /* LCL/Air/Land Fields */
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                                        Package Type
                                      </label>
                                      <select
                                        value={item.package_type || 'Pallet'}
                                        onChange={e => updateCargoItem(index, 'package_type', e.target.value)}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-md focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all text-sm font-medium text-slate-900"
                                      >
                                        <option value="Pallet">Pallet</option>
                                        <option value="Carton">Karton / Box</option>
                                        <option value="Crate">Peti Kayu / Crate</option>
                                        <option value="Drum">Drum / IBC</option>
                                        <option value="Bag">Karung / Bag</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                                        Quantity *
                                      </label>
                                      <input
                                        required
                                        type="number"
                                        min="1"
                                        value={item.package_qty || ''}
                                        onChange={e => updateCargoItem(index, 'package_qty', e.target.value)}
                                        placeholder="Cth: 10"
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-md focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all text-sm font-medium text-slate-900"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                                        Weight (KG) *
                                      </label>
                                      <input
                                        required
                                        type="number"
                                        step="0.01"
                                        value={item.gross_weight || ''}
                                        onChange={e => updateCargoItem(index, 'gross_weight', e.target.value)}
                                        placeholder="Cth: 250"
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-md focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all text-sm font-medium text-slate-900"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                                        Volume (CBM) *
                                      </label>
                                      <input
                                        required
                                        type="number"
                                        step="0.001"
                                        value={item.volume_cbm || ''}
                                        onChange={e => updateCargoItem(index, 'volume_cbm', e.target.value)}
                                        placeholder="Cth: 1.8"
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-md focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all text-sm font-medium text-slate-900"
                                      />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                                        Length (cm)
                                      </label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={item.length || ''}
                                        onChange={e => updateCargoItem(index, 'length', e.target.value)}
                                        placeholder="120"
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-md focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all text-sm font-medium text-slate-900"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                                        Width (cm)
                                      </label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={item.width || ''}
                                        onChange={e => updateCargoItem(index, 'width', e.target.value)}
                                        placeholder="80"
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-md focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all text-sm font-medium text-slate-900"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                                        Height (cm)
                                      </label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={item.height || ''}
                                        onChange={e => updateCargoItem(index, 'height', e.target.value)}
                                        placeholder="100"
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-md focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all text-sm font-medium text-slate-900"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                                        Stackable?
                                      </label>
                                      <select
                                        value={item.is_stackable ? 'YES' : 'NO'}
                                        onChange={e => updateCargoItem(index, 'is_stackable', e.target.value === 'YES')}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-md focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all text-sm font-medium text-slate-900"
                                      >
                                        <option value="YES">✅ Ya</option>
                                        <option value="NO">❌ Tidak</option>
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Summary for item 0 (read-only) */}
                          {index === 0 && (
                            <div className="p-4 bg-blue-50/30">
                              <p className="text-sm text-slate-600">
                                {isFCL
                                  ? `${formData.container_qty || '?'}x ${formData.container_size || 'Container'} ${formData.container_weight ? `(${formData.container_weight} KG each)` : ''}`
                                  : `${formData.package_qty || '?'}x ${formData.package_type || 'Package'} - ${formData.gross_weight || '?'} KG, ${formData.volume_cbm || '?'} CBM`
                                }
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Aggregated Totals */}
                  {formData.cargo_items.length > 1 && (
                    <div className="mt-4 pt-4 border-t-2 border-blue-200">
                      <p className="text-sm font-bold text-slate-700 mb-2">📊 Aggregated Totals:</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {formData.sea_type === 'FCL' && (
                          <>
                            <div className="bg-white p-3 rounded border border-slate-200">
                              <p className="text-xs text-slate-500 font-medium">Total Containers</p>
                              <p className="text-lg font-bold text-blue-600">
                                {formData.cargo_items.reduce((sum, item) => sum + (parseInt(item.container_qty) || 0), 0)}
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded border border-slate-200">
                              <p className="text-xs text-slate-500 font-medium">Total Weight (KG)</p>
                              <p className="text-lg font-bold text-blue-600">
                                {formData.cargo_items.reduce((sum, item) => sum + (parseFloat(item.container_weight) || 0) * (parseInt(item.container_qty) || 0), 0).toFixed(2)}
                              </p>
                            </div>
                          </>
                        )}
                        {(formData.sea_type === 'LCL' || formData.mode === 'air' || formData.mode === 'land') && (
                          <>
                            <div className="bg-white p-3 rounded border border-slate-200">
                              <p className="text-xs text-slate-500 font-medium">Total Packages</p>
                              <p className="text-lg font-bold text-blue-600">
                                {formData.cargo_items.reduce((sum, item) => sum + (parseInt(item.package_qty) || 0), 0)}
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded border border-slate-200">
                              <p className="text-xs text-slate-500 font-medium">Total Weight (KG)</p>
                              <p className="text-lg font-bold text-blue-600">
                                {formData.cargo_items.reduce((sum, item) => sum + (parseFloat(item.gross_weight) || 0), 0).toFixed(2)}
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded border border-slate-200">
                              <p className="text-xs text-slate-500 font-medium">Total Volume (CBM)</p>
                              <p className="text-lg font-bold text-blue-600">
                                {formData.cargo_items.reduce((sum, item) => sum + (parseFloat(item.volume_cbm) || 0), 0).toFixed(3)}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-slate-500 mt-4 italic">
                    💡 Tip: The first cargo item is managed by the form above. Additional items can be added here.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-4">
            {step > 1
              ? <button type="button" onClick={back} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 font-bold transition-all text-sm rounded-md flex items-center gap-2 shadow-sm"><ArrowLeft className="w-4 h-4" /> Kembali</button>
              : <div />}
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold transition-all hover:shadow-md active:translate-y-0 flex items-center gap-2 text-sm rounded-md"
            >
              {loading ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Memproses...</span>
              ) : step === 3 ? (
                <><CheckCircle2 className="w-4 h-4" /> Kirim Permintaan</>
              ) : (
                <>Langkah Selanjutnya <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
