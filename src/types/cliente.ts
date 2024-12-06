export type Cliente = {
    Número: number; // Identificador único del cliente
    Nombre: string; // Nombre del cliente
    Apellido: string; // Apellido del cliente
    ListaPrecios: string; // Tipo de lista de precios del cliente
    CondIVA: string; // Condición frente al IVA
    Zona: string; // Zona geográfica del cliente
    CUIT: string | null; // CUIT del cliente (puede ser nulo)
    Vendedor: string | null; // Apellido del vendedor asociado
    Telefono2: string | null; // Segundo número de teléfono
    Telefono: string | null; // Teléfono principal
    Email: string | null; // Dirección de correo electrónico
    Celular: string | null; // Número de celular
    CuentaLimite: number | null; // Límite de crédito del cliente
    Nacimiento: string | null; // Fecha de nacimiento en formato ISO (e.g., "1985-07-25")
    Localidad: string | null; // Localidad del cliente
    Provincia: string | null; // Provincia del cliente
    Pais: string | null; // País del cliente
    DNI: number | null; // Número de documento
    Domicilio: string | null; // Dirección física del cliente
    Otros: string | null; // Campo para información adicional
  };