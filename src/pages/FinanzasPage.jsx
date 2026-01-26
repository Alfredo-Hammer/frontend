import React, {useState} from "react";
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  ChartPieIcon,
} from "@heroicons/react/24/outline";
import PageHeader from "../components/PageHeader";
import DashboardFinanzas from "../components/finanzas/DashboardFinanzas";
import ConceptosPagoTab from "../components/finanzas/ConceptosPagoTab";
import RegistrarPagoTab from "../components/finanzas/RegistrarPagoTab";
import EstadoCuentaTab from "../components/finanzas/EstadoCuentaTab";
import BecasTab from "../components/finanzas/BecasTab";
import ReportesFinanzasTab from "../components/finanzas/ReportesFinanzasTab";
import CierreCaja from "./finanzas/CierreCaja";

const FinanzasPage = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const tabs = [
    {id: "dashboard", name: "Dashboard", icon: ChartBarIcon},
    {id: "conceptos", name: "Conceptos de Pago", icon: DocumentTextIcon},
    {id: "pagos", name: "Registrar Pago", icon: CurrencyDollarIcon},
    {id: "cierre-caja", name: "Cierre de Caja", icon: CurrencyDollarIcon},
    {
      id: "estado-cuenta",
      name: "Estado de Cuenta",
      icon: ClipboardDocumentListIcon,
    },
    {id: "becas", name: "Becas/Descuentos", icon: AcademicCapIcon},
    {id: "reportes", name: "Reportes", icon: ChartPieIcon},
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardFinanzas />;
      case "conceptos":
        return <ConceptosPagoTab />;
      case "pagos":
        return <RegistrarPagoTab />;
      case "cierre-caja":
        return <CierreCaja />;
      case "estado-cuenta":
        return <EstadoCuentaTab />;
      case "becas":
        return <BecasTab />;
      case "reportes":
        return <ReportesFinanzasTab />;
      default:
        return <DashboardFinanzas />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <PageHeader
        title="Finanzas y Pagos"
        subtitle="Gestión financiera de la escuela"
        icon={CurrencyDollarIcon}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700/50 mb-6">
          <div className="border-b border-gray-700/50">
            <nav className="-mb-px flex overflow-x-auto" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors
                      ${
                        activeTab === tab.id
                          ? "border-blue-400 text-blue-400"
                          : "border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600"
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div>{renderContent()}</div>
      </div>
    </div>
  );
};

export default FinanzasPage;
