import { Cliente } from '../../../types/cliente';
import { formatNumeroCliente } from '../../../utils/numeroClienteMap';
import '../styles/SelectedClient.css';

type SelectedClientProps = {
  cliente: Cliente;
};

const SelectedClient = ({ cliente }: SelectedClientProps) => {
  return (
    <div className="selected-client">
      <h5>Cliente seleccionado:</h5>
      <p>
        <strong>{formatNumeroCliente(cliente.Número)}</strong> - {cliente.Nombre} {cliente.Apellido}
      </p>
    </div>
  );
};

export default SelectedClient;