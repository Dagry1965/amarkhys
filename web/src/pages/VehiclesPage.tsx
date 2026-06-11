import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { Link } from 'react-router-dom';

interface Vehicle {
  id: number;
  client_id: number;
  marque: string;
  modele: string;
  immatriculation: string;
}

interface Client {
  id: number;
  name: string;
}

export const VehiclesPage = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  
  // Formulaire
  const [clientId, setClientId] = useState('');
  const [marque, setMarque] = useState('');
  const [modele, setModele] = useState('');
  const [immat, setImmat] = useState('');

  const fetchData = async () => {
    try {
      // On récupère les deux listes en même temps
      const [resVehicles, resClients] = await Promise.all([
        apiClient.get('/vehicles'),
        apiClient.get('/clients')
      ]);
      console.log("Clients chargés:", resClients.data); // Pour debug dans la console
      setVehicles(resVehicles.data);
      setClients(resClients.data);
    } catch (err) { 
      console.error("Erreur de chargement", err); 
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
        alert("Veuillez choisir un propriétaire");
        return;
    }
    try {
      await apiClient.post('/vehicles', {
        client_id: parseInt(clientId),
        marque,
        modele,
        immatriculation: immat
      });
      // Reset formulaire
      setMarque(''); setModele(''); setImmat(''); setClientId('');
      fetchData(); // Rafraîchir la liste
    } catch (err) { 
      alert("Erreur lors de l'ajout du véhicule"); 
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <Link to="/">← Retour au Dashboard</Link>
      <h1>🚗 Parc Automobile</h1>

      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #007bff', borderRadius: '8px', backgroundColor: '#f8f9fa' }}>
        <h3>Enregistrer un nouveau véhicule</h3>
        <form onSubmit={handleAddVehicle} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          
          <select value={clientId} onChange={e => setClientId(e.target.value)} required style={{padding: '8px'}}>
            <option value="">-- Choisir le Propriétaire --</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <input placeholder="Marque" value={marque} onChange={e => setMarque(e.target.value)} required style={{padding: '8px'}}/>
          <input placeholder="Modèle" value={modele} onChange={e => setModele(e.target.value)} required style={{padding: '8px'}}/>
          <input placeholder="Immatriculation" value={immat} onChange={e => setImmat(e.target.value)} required style={{padding: '8px'}}/>
          
          <button type="submit" style={{ padding: '8px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Ajouter au Parc
          </button>
        </form>
      </div>

      <h3>Véhicules enregistrés</h3>
      <table border={1} cellPadding={12} style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
        <thead style={{ backgroundColor: '#343a40', color: 'white' }}>
          <tr>
            <th>Immatriculation</th>
            <th>Marque / Modèle</th>
            <th>Propriétaire</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.length === 0 ? (
            <tr><td colSpan={3} style={{textAlign: 'center'}}>Aucun véhicule trouvé.</td></tr>
          ) : (
            vehicles.map(v => {
              // On cherche le nom du client dans la liste des clients chargée
              const owner = clients.find(c => c.id === v.client_id);
              return (
                <tr key={v.id}>
                  <td><strong style={{fontSize: '1.1em'}}>{v.immatriculation.toUpperCase()}</strong></td>
                  <td>{v.marque} {v.modele}</td>
                  <td style={{ color: owner ? 'black' : 'red' }}>
                    {owner ? owner.name : `ID Client inconnu (${v.client_id})`}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
