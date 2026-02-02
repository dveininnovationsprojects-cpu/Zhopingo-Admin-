// import SalesStatisticOne from "./child/SalesStatisticOne";
// import TotalSubscriberOne from "./child/TotalSubscriberOne";
// import UsersOverviewOne from "./child/UsersOverviewOne";
// import LatestRegisteredOne from "./child/LatestRegisteredOne";
// import TopPerformerOne from "./child/TopPerformerOne";
// import TopCountries from "./child/TopCountries";
// import GeneratedContent from "./child/GeneratedContent";
// import UnitCountOne from "./child/UnitCountOne";

// const DashBoardLayerOne = () => {
//   return (
//     <>
//       {/* UnitCountOne */}
//       <UnitCountOne />

//       <section className='row gy-4 mt-1'>
//         {/* SalesStatisticOne */}
//         <SalesStatisticOne />

//         {/* TotalSubscriberOne */}
//         <TotalSubscriberOne />

//         {/* UsersOverviewOne */}
//         <UsersOverviewOne />

//         {/* LatestRegisteredOne */}
//         <LatestRegisteredOne />

//         {/* TopPerformerOne */}
//         <TopPerformerOne />

//         {/* TopCountries */}
//         <TopCountries />

//         {/* GeneratedContent */}
//         <GeneratedContent />
//       </section>
//     </>
//   );
// };

// export default DashBoardLayerOne;


import SalesStatisticOne from "./child/SalesStatisticOne";
import TotalSubscriberOne from "./child/TotalSubscriberOne";
import UsersOverviewOne from "./child/UsersOverviewOne";
import LatestRegisteredOne from "./child/LatestRegisteredOne";
import TopPerformerOne from "./child/TopPerformerOne";
// import TopCountries from "./child/TopCountries";
// import GeneratedContent from "./child/GeneratedContent";
import UnitCountOne from "./child/UnitCountOne";

const DashBoardLayerOne = () => {
  return (
    <>
      {/* UnitCountOne - Shop Counts, Revenue */}
      <UnitCountOne />

      <section className='row gy-4 mt-1'>
        {/* SalesStatisticOne - Revenue Graph */}
        <SalesStatisticOne />

        {/* TotalSubscriberOne - Customer Growth */}
        <TotalSubscriberOne />

        {/* UsersOverviewOne - Seller/Customer Split */}
        <UsersOverviewOne />

        {/* LatestRegisteredOne - New Seller/Customer List */}
        <LatestRegisteredOne />

        {/* TopPerformerOne - Top Selling Products */}
        <TopPerformerOne />

        {/* TopCountries - Map REMOVED for India Only Project */}
        {/* <TopCountries /> */}

        {/* GeneratedContent - AI Content REMOVED */}
        {/* <GeneratedContent /> */}
      </section>
    </>
  );
};

export default DashBoardLayerOne;