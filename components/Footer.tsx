import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white mt-auto p-4 border-t">
      <div className="container mx-auto text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Visioneer AI. Todos los derechos reservados.</p>
        <p className="mt-1">
          Transforma tus ideas en realidad visual con el poder de la IA.
        </p>
      </div>
    </footer>
  );
};

export default Footer;