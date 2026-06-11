import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { Link } from 'react-router-dom';

export const InvoicesPage = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [interventions, setInterventions] = useState<any[]>([]);
  
  // États pour l'encaissement
  const [payAmount, setPayAmount] = useState('');
  const [targetInvoice, setTargetInvoice] = useState('');

  const fetchData = async () => {
    try {
      const [resInv, resItv] = await Promise.all([
        apiClient.get('/invoices'),
        apiClient.get('/interventions')
      ]);
      setInvoices(resInv.data);
      setInterventions(resItv.data);
    } catch (err) { console.error("Erreur chargement factures", err); }
  };

  useEffect(() => { fetchData(); }, []);

  // Générer une facture pour une intervention
  const createInvoice = async (itvId: number) => {
    try {
      await apiClient.post('/invoices', { intervention_id: itvId });
      alert("Facture générée !");
      fetchData();
    } catch (err) { alert("Erreur de génération"); }
  };

  // Enregistrer un paiement
  const addPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/payments', {
        invoice_id: parseInt(targetInvoice),
        amount_cents: parseInt(payAmount),
        method: "card"
      });
      setPayAmount(''); setTargetInvoice('');
      alert("Paiement enregistré !");
      fetchData();
    } catch (err) { alert("Erreur de paiement"); }
  };

  return (
    <div style={{ padding: '20px' }}>
      <Link to="/">← Retour au Dashboard</Link>
      <h1>🧾 Facturation & Caisse</h1>

      {/* 1. Interventions prêtes à être facturées */}
      <div style={{ marginBottom: '30px', padding: '15px', background: '#fff3cd', borderRadius: '8px' }}>
        <h3>🛠️ Fiches Atelier en attente de facturation</h3>
        <ul>
          {interventions
            .filter(itv => !invoices.some(inv => inv.intervention_id === itv.id))
            .map(itv => (
              <li key={itv.id} style={{ marginBottom: '10px' }}>
                Intervention #{itv.id} ({itv.notes}) - 
                <button onClick={() => createInvoice(itv.id)} style={{ marginLeft: '10px', cursor: 'pointer' }}>
                  📄 Générer la facture
                </button>
              </li>
            ))}
        </ul>
        {interventions.filter(itv => !invoices.some(inv => inv.intervention_id === itv.id)).length === 0 && <p>Aucune fiche en attente.</p>}
      </div>

      {/* 2. Liste des factures */}
      <h3>Liste des Factures (Ventes)</h3>
      <table border={1} cellPadding={12} style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
        <thead style={{ backgroundColor: '#f4f4f4' }}>
          <tr>
            <th>N° Facture</th>
            <th>Réf Intervention</th>
            <th>Montant Total</th>
            <th>Statut</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map(inv => (
            <tr key={inv.id}>
              <td><strong>FACT-{inv.id}</strong></td>
              <td>Fiche OR-{inv.intervention_id}</td>
              <td>{(inv.total_cents / 100).toFixed(2)} €</td>
              <td>
                <span style={{ 
                  padding: '4px 8px', 
                  borderRadius: '10px', 
                  backgroundColor: inv.status === 'paid' ? '#d4edda' : '#f8d7da',
                  color: inv.status === 'paid' ? '#155724' : '#721c24'
                }}>
                  {inv.status.toUpperCase()}
                </span>
              </td>
              <td>
                {inv.status !== 'paid' && (
                  <button onClick={() => { setTargetInvoice(inv.id.toString()); setPayAmount(inv.total_cents.toString()); }} style={{ cursor: 'pointer' }}>
                    💰 Encaisser
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 3. Formulaire de Paiement (s'affiche au clic) */}
      {targetInvoice && (
        <div style={{ marginTop: '20px', padding: '20px', background: '#e7f3ff', border: '1px solid #b6d4fe', borderRadius: '8px' }}>
          <h4>Encaissement Facture FACT-{targetInvoice}</h4>
          <form onSubmit={addPayment}>
            <label>Montant reçu (en centimes) : </label>
            <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} required style={{ padding: '8px' }} />
            <button type="submit" style={{ marginLeft: '10px', padding: '8px 20px', backgroundColor: '#0d6efd', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Valider le règlement
            </button>
            <button type="button" onClick={() => setTargetInvoice('')} style={{ marginLeft: '5px' }}>Annuler</button>
          </form>
        </div>
      )}
    </div>
  );
};
