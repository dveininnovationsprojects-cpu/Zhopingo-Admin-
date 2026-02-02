import HSNMasterTable from "../components/HSNMasterTable"; // New component
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";

const FormLayoutPage = () => {
  return (
    <>
      <MasterLayout>
        {/* Breadcrumb title-ah 'HSN Master' nu mathiruken */}
        <Breadcrumb title='HSN Master' />

        <div className='row'>
          <div className='col-12'>
             {/* FormLayoutLayer-ku pathila Table varum */}
            <HSNMasterTable />
          </div>
        </div>
      </MasterLayout>
    </>
  );
};

export default FormLayoutPage;