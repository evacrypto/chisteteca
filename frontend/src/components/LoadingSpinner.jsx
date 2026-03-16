import { Spinner } from 'react-bootstrap';

const LoadingSpinner = ({ size = 'medium', text = 'Cargando...' }) => {
  const sizeClasses = {
    small: { width: '30px', height: '30px' },
    medium: { width: '50px', height: '50px' },
    large: { width: '80px', height: '80px' }
  };

  return (
    <div className="loading-spinner flex-column">
      <div 
        className="spinner-custom" 
        style={sizeClasses[size]}
      />
      {text && <p className="text-muted mt-3">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
