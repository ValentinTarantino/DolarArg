const DolarCard = ({ type, buy, sell, source, colorClass, bgClass }) => {
    const formattedBuy = buy !== null && buy !== undefined ? parseFloat(buy).toFixed(2) : '-';
    const formattedSell = sell !== null && sell !== undefined ? parseFloat(sell).toFixed(2) : '-';

    return (
        <div className={`card h-100 ${colorClass || ''} ${bgClass || ''}`}>
            <div className="card-body d-flex flex-column">
                <h5 className="card-title text-center text-uppercase fw-bold mb-3">{type}</h5>
                <hr className="my-2" />
                <div className="row text-center mt-3 flex-grow-1 align-items-center">
                    <div className="col-6">
                        <p className="mb-0 fw-bold text-muted">Compra</p>
                        <h4 className="text-success">$ {formattedBuy}</h4>
                    </div>
                    <div className="col-6">
                        <p className="mb-0 fw-bold text-muted">Venta</p>
                        <h4 className="text-danger">$ {formattedSell}</h4>
                    </div>
                </div>
                {source && (
                    <p className="card-text text-muted text-center mt-3" style={{ fontSize: '0.8rem' }}>
                        Fuente: {source}
                    </p>
                )}
            </div>
        </div>
    );
};

export default DolarCard;