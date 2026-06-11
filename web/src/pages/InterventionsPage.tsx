import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { Link } from 'react-router-dom';

export const InterventionsPage = () => {
  // On initialise avec des tableaux vides pour éviter les erreurs .map
  const [interventions, setInterventions] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  
  const [aptId, setAptId] = useState('');
  const [notes, setNotes] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [servicePrice, setServicePrice] = useState(0);

  const fetchData = async () => {
    try {
      // Étape par étape pour être sûr que chaque appel finit
      const resApts = await apiClient.get('/appointments');
      setAppointments(resApts.data || []);

      const resVeh = await apiClient.get('/vehicles');
      setVehicles(resVeh.data || []);

      const resItv = await apiClient.get('/interventions');
      setInterventions(resItv.data || []);
      
    } catch (err) {
      console.error("Erreur de chargement", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aptId) return alert("Veuillez choisir un rendez-vous");
    try {
      await apiClient.post('/interventions', {
        appointment_id: parseInt(aptId),
        notes: notes,
        status: "open",
        service_lines: [{ description: serviceDesc, quantity: 1, unit_price: servicePrice }],
        product_lines: []
      });
      setAptId(''); setNotes(''); setServiceDesc(''); setServicePrice(0);
      fetchData();
    } catch (err) {
      alert("Erreur lors de la création de la fiche");
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <Link to="/">← Retour au Dashboard</Link>
      <h1>🛠️ Fiches Atelier (Interventions)</h1>

      <div style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h3>Nouvelle Fiche</h3>
        <form onSubmit={handleAdd}>
          
          <div style={{ marginBottom: '10px' }}>
            <label><strong>Rendez-vous client : </strong></label>
            <select 
              value={aptId} 
              onChange={e => setAptId(e.target.value)} 
              required
              style={{ padding: '8px', minWidth: '250px' }}
            >
              <option value="">-- {appointments.length} RDV trouvés --</option>
              {/* Utilisation de l'opérateur ? pour éviter les crashs si appointments est nul */}
              {appointments?.map((a: any) => {
                const v = vehicles?.find((veh: any) => veh.id === a.vehicle_id);
                return (
                  <option key={a.id} value={a.id}>
                    RDV #{a.id} - {v ? v.immatriculation : `Véhicule ${a.vehicle_id}`}
                  </option>
                );
              })}
            </select>
          </div>

          <input 
            placeholder="Travail à faire (ex: Vidange)" 
            value={serviceDesc} 
            onChange={e => setServiceDesc(e.target.value)} 
            required 
            style={{padding: '8px'}}
          />

          <input 
            type="number" 
            placeholder="Prix" 
            onChange={e => setServicePrice(parseInt(e.target.value) || 0)} 
            style={{padding: '8px', marginLeft: '10px'}}
          />

          <button type="submit" style={{marginLeft: '10px', padding: '8px 15px', cursor: 'pointer', background: '#28a745', color: 'white', border: 'none'}}>
            Créer l'intervention
          </button>
        </form>
      </div>

      <h3>Historique des interventions</h3>
      <table border={1} cellPadding={10} style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{background: '#f4f4f4'}}>
            <th>ID</th>
            <th>Véhicule</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {interventions?.map((i: any) => {
            const apt = appointments?.find((a: any) => a.id === i.appointment_id);
            const v = apt ? vehicles?.find((veh: any) => veh.id === apt.vehicle_id) : null;
            return (
              <tr key={i.id}>
                <td>OR-{i.id}</td>
                <td>{v ? v.immatriculation : '---'}</td>
                <td>
                  <Link to="/invoices">
                    <button style={{cursor: 'pointer'}}>Facturer</button>
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
