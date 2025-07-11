// src/App.jsx
import React, { useState, useEffect } from 'react';
import DolarCard from './components/DolarCard';

const API_URL = 'https://dolarapi.com/v1/dolares';

function App() {
    const [dolarData, setDolarData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);

    // Definir el orden y los tipos de dólar que nos interesan,
    // usando los nombres EXACTOS de la propiedad 'casa' que vienen de la API (en minúsculas).
    // ¡Dólar Mayorista movido debajo de Tarjeta!
    const desiredTypesOrder = [
        "oficial",
        "blue",
        "bolsa",
        "contadoconliqui",
        "tarjeta",
        "mayorista", // <-- ¡Mayorista movido aquí!
        "cripto"
    ];

    const fetchDolarData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }
            const data = await response.json();

            const filteredAndSortedData = desiredTypesOrder
                .map(type => data.find(dolar => dolar.casa === type))
                .filter(Boolean);

            setDolarData(filteredAndSortedData);
            setLastUpdate(new Date().toLocaleString('es-AR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }));
        } catch (err) {
            console.error("Error fetching dolar data:", err);
            setError(new Error("No se pudieron cargar las cotizaciones. Por favor, intenta de nuevo más tarde."));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDolarData();
        const intervalId = setInterval(fetchDolarData, 5 * 60 * 1000);
        return () => clearInterval(intervalId);
    }, []);

    const getDisplayName = (casaType) => {
        switch (casaType) {
            case 'oficial': return 'Oficial';
            case 'blue': return 'Blue';
            case 'bolsa': return 'Bolsa (MEP)';
            case 'contadoconliqui': return 'CCL';
            case 'tarjeta': return 'Tarjeta';
            case 'cripto': return 'Cripto';
            case 'mayorista': return 'Mayorista';
            default: return casaType.charAt(0).toUpperCase() + casaType.slice(1);
        }
    };

    const getDolarCardColorClass = (type) => {
        switch (type) {
            case 'blue': return 'border-primary';
            case 'oficial': return 'border-success';
            case 'bolsa': return 'border-warning';
            case 'contadoconliqui': return 'border-info';
            case 'tarjeta': return 'border-danger';
            case 'cripto': return 'border-dark';
            case 'mayorista': return 'border-secondary';
            default: return '';
        }
    };

    const getDolarCardBgClass = (type) => {
        return `dolar-card-bg-${type}`;
    };

    return (
        <div className="container app-container">
            <h1 className="section-title">Cotización del Dólar en Argentina</h1>

            {loading && (
                <p className="loading-message">Cargando cotizaciones...</p>
            )}

            {error && (
                <p className="error-message">
                    {error.message}
                </p>
            )}

            {!loading && !error && dolarData.length === 0 && (
                <p className="loading-message">No se encontraron datos de cotizaciones para los tipos deseados.</p>
            )}

            {!loading && !error && dolarData.length > 0 && (
                <div className="row d-flex justify-content-center">
                    {dolarData.map((dolar) => (
                        <div key={dolar.casa} className="col-12 col-md-6 col-lg-4 d-flex"> {/* Eliminamos mb-4 para usar los gutters */}
                            <DolarCard
                                type={`Dólar ${getDisplayName(dolar.casa)}`}
                                buy={dolar.compra}
                                sell={dolar.venta}
                                source={dolar.nombre}
                                colorClass={getDolarCardColorClass(dolar.casa)}
                                bgClass={getDolarCardBgClass(dolar.casa)}
                            />
                        </div>
                    ))}
                </div>
            )}

            {lastUpdate && (
                <p className="last-update-time">Última actualización: {lastUpdate}</p>
            )}

            <footer className="text-center text-muted mt-auto pt-4 pb-2" style={{ fontSize: '0.8rem' }}>
                <p>Datos obtenidos de <a href="https://dolarapi.com/" target="_blank" rel="noopener noreferrer">DolarAPI.com</a></p>
                <p>© {new Date().getFullYear()} Tu Nombre / Dólar Hoy Argentina</p>
            </footer>
        </div>
    );
}

export default App;