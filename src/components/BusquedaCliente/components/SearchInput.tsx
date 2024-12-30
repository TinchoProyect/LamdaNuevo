import { ChangeEvent } from 'react';
import '../styles/SearchInput.css';

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

const SearchInput = ({ 
  value, 
  onChange,
  placeholder = "Buscar por número, nombre o apellido" 
}: SearchInputProps) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="search-input-wrapper">
      <input
        type="text"
        className="form-control search-input"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
      />
    </div>
  );
};

export default SearchInput;