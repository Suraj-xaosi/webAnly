type Site = {
  id: string;
  domain: string;
};

export default function ShowScript({ site }: { site: Site }) {
  const { id, domain } = site;

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold text-purple-300 mb-4">
        Your Script
      </h2>
      <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto">
        {
        `<script siteID="${id}"siteName="${domain}"></script>`
        }
      </pre>
    </div>
  );
}