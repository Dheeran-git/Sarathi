import { useParams } from 'react-router-dom';

function SchemeDetailPage() {
  const { id } = useParams();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="font-display text-4xl text-navy">
        योजना विवरण — Scheme: {id}
      </h1>
    </div>
  );
}

export default SchemeDetailPage;
