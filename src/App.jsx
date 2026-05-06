import { useState, useEffect } from 'react';
import './index.css';

// Constants
const FIXED_RATE_MAD_TO_XOF = 60; // 1 MAD = 60 FCFA
const FEE_PERCENTAGE = 0.035; // 3.5%

function App() {
  const [currentPage, setCurrentPage] = useState('home'); // home, dashboard, admin, auth
  const [user, setUser] = useState(null);
  
  // App Data State (Mock Database)
  const [transactions, setTransactions] = useState([
    { id: 'TRX-9823', date: '2026-05-01', amountSent: '100000', sourceCurr: 'XOF', amountReceived: '1608.33', destCurr: 'MAD', status: 'success', receiver: 'Ali Diop' },
    { id: 'TRX-9824', date: '2026-05-02', amountSent: '500', sourceCurr: 'MAD', amountReceived: '28950.00', destCurr: 'XOF', status: 'success', receiver: 'Fatou Ndiaye' }
  ]);

  // Simulator State
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('100000');
  const [sourceCurr, setSourceCurr] = useState('XOF');
  const [destCurr, setDestCurr] = useState('MAD');
  const [liveRate, setLiveRate] = useState(62.5); // Default mock
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  const [notification, setNotification] = useState('');
  
  // Auth Form State
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  
  // Transfer Form State
  const [formData, setFormData] = useState({ firstName: '', lastName: '', phone: '', senderAccount: '', receiverAccount: '' });

  // Live API Rate Fetch
  useEffect(() => {
    const fetchRate = async () => {
      setIsFetchingRate(true);
      try {
        const response = await fetch(`https://open.er-api.com/v6/latest/${sourceCurr}`);
        const data = await response.json();
        if (data && data.rates && data.rates[destCurr]) {
          setLiveRate(data.rates[destCurr]);
        } else {
          setLiveRate(sourceCurr === 'MAD' ? 62.5 : 1/62.5);
        }
      } catch (error) {
        console.error("Erreur API:", error);
        setLiveRate(sourceCurr === 'MAD' ? 62.5 : 1/62.5);
      } finally {
        setIsFetchingRate(false);
      }
    };
    
    if (sourceCurr !== destCurr) {
      fetchRate();
    } else {
      setLiveRate(1);
    }
  }, [sourceCurr, destCurr]);

  // Calculations
  const numAmount = parseFloat(amount) || 0;
  let standardAmount = numAmount * liveRate;
  let amountAfterFees = numAmount * (1 - FEE_PERCENTAGE);
  let finalAmount = 0;

  if (sourceCurr === 'MAD' && destCurr === 'XOF') {
    finalAmount = amountAfterFees * FIXED_RATE_MAD_TO_XOF;
  } else if (sourceCurr === 'XOF' && destCurr === 'MAD') {
    finalAmount = amountAfterFees / FIXED_RATE_MAD_TO_XOF;
  } else {
    finalAmount = amountAfterFees;
  }

  const handleSwap = () => {
    setSourceCurr(destCurr);
    setDestCurr(sourceCurr);
    setAmount(finalAmount.toFixed(0));
  };

  const formatCurrency = (val, currency) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency, maximumFractionDigits: 2 }).format(val);
  };

  const handleTransferSubmit = () => {
    const newTx = {
      id: `TRX-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      amountSent: numAmount.toString(),
      sourceCurr,
      amountReceived: finalAmount.toFixed(2),
      destCurr,
      status: 'pending',
      receiver: `${formData.firstName} ${formData.lastName}`
    };
    
    setTransactions([newTx, ...transactions]);
    setStep(3);
    
    // Simulate SMS/Email Notification
    setNotification('✉️ Notification SMS et Email envoyée au destinataire et à l\'expéditeur.');
  };

  const loginUser = (e) => {
    e.preventDefault();
    setUser({ name: authForm.name || 'Utilisateur', email: authForm.email, role: 'client' });
    setCurrentPage('dashboard');
  };

  // --- VIEWS ---

  const renderNavbar = () => (
    <nav className="navbar">
      <div className="nav-brand" onClick={() => setCurrentPage('home')} style={{cursor: 'pointer'}}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
        Marhaba
      </div>
    </nav>
  );

  const renderSimulator = () => (
    <div className="app-container">
      {step === 1 && (
        <>
          <div style={{textAlign: 'center', marginBottom: '1.5rem'}}>
            <h2 style={{fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem'}}>Simulateur de Transfert</h2>
            <div className="live-rate-badge">
              <div className="live-dot"></div>
              {isFetchingRate ? 'Actualisation...' : `Taux Live API: 1 ${sourceCurr} = ${liveRate.toFixed(4)} ${destCurr}`}
            </div>
          </div>

          <div className="currency-group">
            <div className="input-box">
              <div className="input-label"><span>Vous envoyez</span></div>
              <div className="input-row">
                <select className="currency-select" value={sourceCurr} onChange={(e) => {
                  setSourceCurr(e.target.value);
                  if(e.target.value === destCurr) setDestCurr(sourceCurr);
                }}>
                  <option value="XOF">FCFA</option>
                  <option value="MAD">MAD</option>
                </select>
                <input type="number" className="amount-input" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
            </div>

            <button className="swap-btn" onClick={handleSwap}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 10v12M15 14v-12M3 14l4 4 4-4M19 6l-4-4-4 4" />
              </svg>
            </button>

            <div className="input-box">
              <div className="input-label"><span>Le destinataire reçoit</span></div>
              <div className="input-row">
                <select className="currency-select" value={destCurr} onChange={(e) => {
                  setDestCurr(e.target.value);
                  if(e.target.value === sourceCurr) setSourceCurr(destCurr);
                }}>
                  <option value="MAD">MAD</option>
                  <option value="XOF">FCFA</option>
                </select>
                <input type="text" className="amount-input" value={finalAmount.toFixed(2)} readOnly />
              </div>
            </div>
          </div>

          <div className="exchange-info">
            <div className="info-row">
              <span>Frais de transfert (3.5%)</span>
              <span className="info-val">-{formatCurrency(numAmount * FEE_PERCENTAGE, sourceCurr)}</span>
            </div>
            <div className="info-row">
              <span>Montant via Taux Standard API ({liveRate.toFixed(4)})</span>
              <span className="info-val strike" style={{fontWeight: 'normal', fontSize: '0.9rem'}}>{formatCurrency(standardAmount, destCurr)}</span>
            </div>
            <div className="info-row" style={{marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)'}}>
              <span>Montant Final (Taux fixe Marhaba)</span>
              <span className="info-val highlight">{formatCurrency(finalAmount, destCurr)}</span>
            </div>
          </div>

          <button className="btn-primary" onClick={() => setStep(2)}>
            Continuer le transfert
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <div className="card-title">Informations de transfert</div>
          
          <div className="form-group" style={{background: 'var(--surface-light)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '1.5rem'}}>
            <label className="form-label" style={{color: 'var(--primary)', fontWeight: 600}}>Vos informations (Expéditeur)</label>
            <input type="text" className="form-input" placeholder="Votre Compte (RIB / Mobile Money)" value={formData.senderAccount} onChange={(e) => setFormData({...formData, senderAccount: e.target.value})} />
          </div>

          <label className="form-label" style={{color: 'var(--text-main)', fontWeight: 600}}>Informations du Destinataire</label>
          <div className="form-group">
            <label className="form-label">Prénom & Nom</label>
            <div style={{display: 'flex', gap: '1rem'}}>
              <input type="text" className="form-input" placeholder="Prénom" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} />
              <input type="text" className="form-input" placeholder="Nom" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Téléphone (Notification SMS)</label>
            <input type="tel" className="form-input" placeholder="+212 6 XX XX XX XX" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Compte destinataire (RIB / Mobile Money)</label>
            <input type="text" className="form-input" placeholder="Saisir le compte" value={formData.receiverAccount} onChange={(e) => setFormData({...formData, receiverAccount: e.target.value})} />
          </div>
          <button className="btn-primary" onClick={handleTransferSubmit}>Confirmer & Payer</button>
          <button className="btn-secondary" onClick={() => setStep(1)}>Retour</button>
        </>
      )}

      {step === 3 && (
        <div className="success-container">
          <div className="success-icon">✓</div>
          <h2 style={{fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem'}}>Transfert Initié !</h2>
          <p style={{color: 'var(--text-muted)', marginBottom: '1.5rem'}}>L'argent est en route vers {formData.firstName}.</p>
          
          {notification && <div className="notification-banner">{notification}</div>}

          <div style={{background: 'var(--surface-light)', padding: '1.5rem', borderRadius: '12px', textAlign: 'left', marginBottom: '1.5rem', border: '1px solid var(--border)'}}>
            <div className="info-row"><span>Envoyé</span><span className="info-val">{formatCurrency(numAmount, sourceCurr)}</span></div>
            <div className="info-row"><span>Reçu</span><span className="info-val highlight">{formatCurrency(finalAmount, destCurr)}</span></div>
            <div className="info-row"><span>Destinataire</span><span className="info-val">{formData.firstName} {formData.lastName}</span></div>
          </div>

          <button className="btn-primary" onClick={() => { 
            setStep(1); 
            setAmount('100000');
            setFormData({ firstName: '', lastName: '', phone: '', senderAccount: '', receiverAccount: '' });
          }}>
            Faire un nouveau transfert
          </button>
        </div>
      )}
    </div>
  );

  const renderHome = () => (
    <div className="page-container hero-section">
      <div className="hero-text">
        <h1>Envoyez de l'argent avec <span>Transparence</span> et Rapidité</h1>
        <p>Marhaba Money révolutionne vos transferts entre le Maroc et l'Afrique de l'Ouest. Taux imbattables, frais fixes et réception instantanée.</p>
        <ul className="feature-list">
          <li><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg> Taux transparent en temps réel</li>
          <li><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg> Notifications SMS & Email incluses</li>
          <li><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg> Sécurité bancaire garantie</li>
        </ul>
      </div>
      <div>
        {renderSimulator()}
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="page-container">
      <h2 style={{fontSize: '2rem', marginBottom: '2rem'}}>Mon Tableau de Bord</h2>
      <div className="dashboard-grid">
        <div className="stat-card">
          <h3>Total Envoyé (30j)</h3>
          <div className="value">450,000 FCFA</div>
        </div>
        <div className="stat-card">
          <h3>Transferts Réalisés</h3>
          <div className="value">{transactions.length}</div>
        </div>
        <div className="stat-card">
          <h3>Destinataires Enregistrés</h3>
          <div className="value">3</div>
        </div>
      </div>

      <div className="card-title">Historique des transferts</div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID Transaction</th>
              <th>Date</th>
              <th>Destinataire</th>
              <th>Montant Envoyé</th>
              <th>Montant Reçu</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx => (
              <tr key={tx.id}>
                <td style={{fontWeight: 500}}>{tx.id}</td>
                <td>{tx.date}</td>
                <td>{tx.receiver}</td>
                <td>{formatCurrency(tx.amountSent, tx.sourceCurr)}</td>
                <td style={{color: 'var(--primary)', fontWeight: 600}}>{formatCurrency(tx.amountReceived, tx.destCurr)}</td>
                <td>
                  <span className={`status-badge ${tx.status === 'success' ? 'success' : 'pending'}`}>
                    {tx.status === 'success' ? 'Terminé' : 'En cours'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAdmin = () => (
    <div className="page-container">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
        <h2 style={{fontSize: '2rem'}}>Panel Administrateur</h2>
        <div className="live-rate-badge">Mode Admin Activé</div>
      </div>
      
      <div className="dashboard-grid">
        <div className="stat-card">
          <h3>Volume Global (MAD)</h3>
          <div className="value">124,500</div>
        </div>
        <div className="stat-card">
          <h3>Frais Générés (MAD)</h3>
          <div className="value">4,357.50</div>
        </div>
        <div className="stat-card">
          <h3>Taux Actuel API</h3>
          <div className="value" style={{color: 'var(--primary)'}}>{liveRate.toFixed(2)}</div>
        </div>
      </div>

      <div className="card-title">Toutes les transactions (Global)</div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>ID</th>
              <th>Envoi</th>
              <th>Réception</th>
              <th>Statut</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx => (
              <tr key={tx.id}>
                <td>{user ? user.name : 'Client'}</td>
                <td>{tx.id}</td>
                <td>{formatCurrency(tx.amountSent, tx.sourceCurr)}</td>
                <td>{formatCurrency(tx.amountReceived, tx.destCurr)}</td>
                <td>
                  <span className={`status-badge ${tx.status === 'success' ? 'success' : 'pending'}`}>
                    {tx.status === 'success' ? 'Terminé' : 'En cours'}
                  </span>
                </td>
                <td>
                  {tx.status === 'pending' && (
                    <button style={{background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600}} onClick={() => {
                      setTransactions(transactions.map(t => t.id === tx.id ? {...t, status: 'success'} : t));
                    }}>
                      Valider
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAuth = () => (
    <div className="page-container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh'}}>
      <div className="app-container" style={{width: '100%', maxWidth: '400px', margin: '0 auto'}}>
        <div className="card-title" style={{textAlign: 'center', borderBottom: 'none'}}>Créer un compte</div>
        <form onSubmit={loginUser}>
          <div className="form-group">
            <label className="form-label">Nom complet</label>
            <input type="text" className="form-input" required placeholder="Votre nom" value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" required placeholder="email@exemple.com" value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Mot de passe</label>
            <input type="password" className="form-input" required placeholder="••••••••" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} />
          </div>
          <button type="submit" className="btn-primary">S'inscrire / Se connecter</button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {renderNavbar()}
      {currentPage === 'home' && renderHome()}
      {currentPage === 'dashboard' && renderDashboard()}
      {currentPage === 'admin' && renderAdmin()}
      {currentPage === 'auth' && renderAuth()}
    </>
  );
}

export default App;
