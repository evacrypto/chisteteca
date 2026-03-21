import './VipBadge.css';

const VipBadge = ({ className = '' }) => (
  <span className={`vip-badge ${className}`} title="Usuario VIP">VIP</span>
);

export default VipBadge;
