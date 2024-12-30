import { ChangeEvent } from 'react';

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
};

const SearchInput = ({ value, onChange }: SearchInputProps) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <input
      type="text"
      className="form-control mb-4 search-input"
      placeholder="Buscar por número, nombre o apellido"
      value={value}
      onChange={handleChange}
    />
  );
}

export default SearchInput;