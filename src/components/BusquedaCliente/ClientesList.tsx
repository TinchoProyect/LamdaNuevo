import { useClientes } from '../../context/ClientesContext';
import { Cliente } from '../../types/cliente';
import { formatNumeroCliente } from '../../utils/numeroClienteMap';

type ClientesListProps = {
  searchTerm: string;
  selectedCliente: Cliente | null;
  onSelectCliente: (cliente: Cliente) => void;
};

const MAX_RESULTS = 10;

const ClientesList = ({ searchTerm, selectedCliente, onSelectCliente }: ClientesListProps) => {
  const { clientes } = useClientes();

  const filteredClientes = searchTerm ? clientes.filter((cliente: Cliente) => {
    const numero = formatNumeroCliente(cliente.Número);
    const nombre = cliente.Nombre?.toLowerCase() || '';
    const apellido = cliente.Apellido?.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();
    
    return numero.includes(searchTerm) || 
           nombre.includes(searchLower) || 
           apellido.includes(searchLower);
  }) : [];

  const limitedClientes = filteredClientes.slice(0, MAX_RESULTS);

  if (!searchTerm) {
    return null;
  }

  return (
    <div className="clientes-list-container mb-3">
      {limitedClientes.length > 0 ? (
        <ul className="list-group">
          {limitedClientes.map((cliente: Cliente) => (
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
          {filteredClientes.length > MAX_RESULTS && (
            <li className="list-group-item text-muted text-center">
              Hay más resultados, refine su búsqueda.
            </li>
          )}
        </ul>
      ) : (
        <p className="text-center">No se encontraron clientes</p>
      )}
    </div>
  );
};

export default ClientesList;