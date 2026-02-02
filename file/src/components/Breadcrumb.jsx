import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
// eslint-disable-next-line react/prop-types
const Breadcrumb = ({ title }) => {
  return (
    <div className='mb-24'>
      <h4 className='fw-semibold mb-0'>{title}</h4>
      {/* Nav links removed for a cleaner look as per client style */}
    </div>
  );
};

export default Breadcrumb;