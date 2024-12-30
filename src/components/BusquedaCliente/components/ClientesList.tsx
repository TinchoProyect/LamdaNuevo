import { Cliente } from '../../../types/cliente';
import { formatNumeroCliente } from '../../../utils/numeroClienteMap';
import '../styles/ClientesList.css';

type ClientesListProps = {
  clientes: Cliente[];
  selectedCliente: Cliente | null;
  onSelectCliente: (cliente: Cliente) => void;
  maxResults?: number;
};

const ClientesList = ({ 
  clientes,
  selectedCliente, 
  onSelectCliente,
  maxResults = 10
}: ClientesListProps) => {
  const limitedClientes = clientes.slice(0, maxResults);

  if (clientes.length === 0) {
    return null;
  }

  return (
    <div className="clientes-list-container">
      <ul className="list-group">
        {limitedClientes.map((cliente) => (
          <li
            key={cliente.Número}
            className={`list-group-item list-group-item-action ${
              selectedCliente?.Número === cliente.Número ? 'active' : ''
            }`}
            onClick={() => onSelectCliente(cliente)}
          >
            <strong>{formatNumeroCliente(cliente.Número)}</strong> - {cliente.Nombre} {cliente.Apellido}
          </li>
        ))}
        {clientes.length > maxResults && (
          <li className="list-group-item text-muted text-center">
            Hay más resultados, refine su búsqueda.
          </li>
        )}
      </ul>
    </div>
  );
};

export default ClientesList;