import { Link, useLocation, useNavigate } from "react-router";
import {
  Menu,
  X,
  Code2,
  LogOut,
  KeyRound,
  User,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "./ui/navigation-menu";
import axios from "axios";
import Cookies from "js-cookie";
import Notification from "./Notification";
import { useUser } from "@/context/UserContext";

// Define as rotas de navegação do menu
interface NavigationItem {
  to?: string;
  label: string;
  submenu?: { to: string; label: string }[];
}

export default function Header() {
  // Estado para controlar o menu mobile aberto/fechado
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Hook para saber qual rota está ativa
  const location = useLocation();

  // Hook para obter o usuário e suas roles
  const { user } = useUser();

  // Verifica se o usuário é admin ou professor
  const isAdmin = user?.roles?.includes("admin") || false;
  const isProfessor = user?.roles?.includes("professor") || false;

  // Define os itens de navegação baseado nas permissões
  const navigationItems: NavigationItem[] = [
    { to: "/home", label: "Dashboard" },
    { to: "/activities", label: "Atividades" },
    { to: "/submissions", label: "Submissões" },
    { to: "/classes", label: "Turmas" },
    // Só mostra o item "Gerenciar" se o usuário for admin
<<<<<<< HEAD
    ...(isAdmin
      ? [
          {
            label: "Gerenciar",
            submenu: [
              { to: "/students", label: "Gerenciar Alunos" },
              { to: "/teachers", label: "Gerenciar Professores" },
            ],
          },
        ]
      : []),
=======
    ...(isAdmin ? [{
      label: "Gerenciar",
      submenu: [
        { to: "/students", label: "Gerenciar Alunos" },
        { to: "/teachers", label: "Gerenciar Professores" }
      ]
    }] : []),
    // Mostra o item "Problemas" se o usuário for admin ou professor
    ...(isAdmin || isProfessor ? [{
      label: "Problemas",
      submenu: [
        { to: "/problems", label: "Gerenciar Problemas" }
      ]
    }] : []),
>>>>>>> upstream/visualizacao-perfil
  ];

  // Alterna o menu mobile
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Fecha o menu mobile
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Alterna o menu de perfil
  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  // Fecha o menu de perfil ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    if (isProfileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  // Retorna se a rota está ativa
  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await axios.get(`${import.meta.env.VITE_API_URL}/sanctum/csrf-cookie`, {
        withCredentials: true,
      });

      await axios.post(
        `${import.meta.env.VITE_API_URL}/logout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-XSRF-TOKEN": Cookies.get("XSRF-TOKEN"),
          },
          withCredentials: true,
        }
      );
      localStorage.removeItem("auth_token");
      navigate("/login");
    } catch (error) {
      console.error("Erro ao fazer logout", error);
      setError("Erro ao fazer logout");
    }
  }

  return (
    <>
      {error && (
        <Notification
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo e nome do app */}
            <div className="flex-shrink-0">
              <Link
                to="/home"
                className="flex items-center space-x-2 group"
                onClick={closeMobileMenu}
              >
                <div className="relative">
                  {/* Efeito gradiente atrás do ícone */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
                  <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                    <Code2 className="h-6 w-6 text-white" />
                  </div>
                </div>
                <span className="text-gray-900 text-xl font-bold tracking-wide bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  IFCode
                </span>
              </Link>
            </div>

            {/* Menu de navegação (desktop) */}
            <NavigationMenu className="hidden md:flex">
              <NavigationMenuList className="flex space-x-1">
                {navigationItems.map((item) => (
                  <NavigationMenuItem key={item.label}>
                    {item.submenu ? (
                      // Item com dropdown
                      <div className="relative dropdown-container">
                        <button
                          className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-1 ${
                            item.submenu.some((sub) => isActiveRoute(sub.to))
                              ? "text-blue-600 bg-blue-50 shadow-sm"
                              : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                          }`}
                        >
                          {item.label}
                          <ChevronDown className="w-4 h-4" />
                          {/* Barra decorativa se está ativo */}
                          {item.submenu.some((sub) =>
                            isActiveRoute(sub.to)
                          ) && (
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
                          )}
                        </button>
                        {/* Dropdown menu */}
                        <div className="absolute left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible dropdown-container:hover dropdown-menu transition-all duration-200 z-50">
                          <div className="py-2">
                            {item.submenu.map((subItem) => (
                              <Link
                                key={subItem.to}
                                to={subItem.to}
                                className={`block px-4 py-2 text-sm transition-colors ${
                                  isActiveRoute(subItem.to)
                                    ? "text-blue-600 bg-blue-50 font-medium"
                                    : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                                }`}
                              >
                                {subItem.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                        <style>{`
                          .dropdown-container:hover .dropdown-menu {
                            opacity: 1;
                            visibility: visible;
                          }
                        `}</style>
                      </div>
                    ) : (
                      // Item sem dropdown
                      <Link
                        to={item.to!}
                        className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                          isActiveRoute(item.to!)
                            ? "text-blue-600 bg-blue-50 shadow-sm"
                            : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                        }`}
                      >
                        {item.label}
                        {/* Barra decorativa se está ativo */}
                        {isActiveRoute(item.to!) && (
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
                        )}
                      </Link>
                    )}
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>

            {/* Botões de ação (desktop) */}
            <div className="hidden md:flex items-center gap-3">
              {/* Menu de perfil dropdown */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={toggleProfileMenu}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-purple-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  aria-expanded={isProfileMenuOpen}
                  aria-haspopup="true"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-purple-500 flex items-center justify-center shadow-md">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-900 transition-transform duration-200 ${
                      isProfileMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown menu */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-purple-100 py-2 z-50">
                    <Link
                      to="/perfil" // <-- A ROTA
                      className="flex flex-col px-4 py-3 border-b border-gray-100 text-gray-700 hover:bg-purple-50 transition-colors"
                      onClick={() => setIsProfileMenuOpen(false)} // Fecha o menu ao clicar
                    >
                      <p className="text-sm font-medium text-gray-900 hover:text-purple-700">
                        Meu Perfil
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Gerencie sua conta
                      </p>
                    </Link>
                    <div className="py-2">
                      <Link
                        to="/change-password"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <KeyRound className="w-4 h-4" />
                        <span>Alterar Senha</span>
                      </Link>

                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sair</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Botão hamburguer para abrir/fechar menu mobile */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="relative inline-flex items-center justify-center p-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-all duration-200 group"
                aria-expanded={isMobileMenuOpen}
                aria-label="Toggle navigation menu"
              >
                {/* Efeito gradiente de fundo no hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                {/* Ícone de X se aberto, hambúrguer se fechado */}
                {isMobileMenuOpen ? (
                  <X className="relative h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="relative h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* Menu mobile (aparece só no mobile) */}
          <div
            className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
              isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="border-t border-gray-200/50 bg-white/95 backdrop-blur-sm">
              <div className="px-2 pt-3 pb-4 space-y-2">
                {navigationItems.map((item) => (
                  <div key={item.label}>
                    {item.submenu ? (
                      // Item com submenu
                      <div>
                        <button
                          onClick={() =>
                            setOpenDropdown(
                              openDropdown === item.label ? null : item.label
                            )
                          }
                          className={`relative flex items-center justify-between w-full px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                            item.submenu.some((sub) => isActiveRoute(sub.to))
                              ? "text-blue-600 bg-blue-50 shadow-sm border-l-4 border-blue-600"
                              : "text-gray-700 hover:text-blue-600 hover:bg-gray-50 border-l-4 border-transparent"
                          }`}
                        >
                          <span>{item.label}</span>
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${
                              openDropdown === item.label ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                        {/* Submenu items */}
                        <div
                          className={`overflow-hidden transition-all duration-200 ${
                            openDropdown === item.label ? "max-h-48" : "max-h-0"
                          }`}
                        >
                          <div className="pl-4 pt-2 space-y-1">
                            {item.submenu.map((subItem) => (
                              <Link
                                key={subItem.to}
                                to={subItem.to}
                                className={`block px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
                                  isActiveRoute(subItem.to)
                                    ? "text-blue-600 bg-blue-50 font-medium"
                                    : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                                }`}
                                onClick={closeMobileMenu}
                              >
                                {subItem.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Item sem submenu
                      <Link
                        to={item.to!}
                        className={`relative flex items-center px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                          isActiveRoute(item.to!)
                            ? "text-blue-600 bg-blue-50 shadow-sm border-l-4 border-blue-600"
                            : "text-gray-700 hover:text-blue-600 hover:bg-gray-50 border-l-4 border-transparent"
                        }`}
                        onClick={closeMobileMenu}
                      >
                        <span className="flex-1">{item.label}</span>
                        {/* Bolinha colorida se está ativo */}
                        {isActiveRoute(item.to!) && (
                          <div className="w-2 h-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
                        )}
                      </Link>
                    )}
                  </div>
                ))}

                {/* Menu de perfil no mobile */}
                <div className="pt-2 mt-2 border-t border-purple-100">
                  <div className="px-4 py-3 rounded-lg mx-2 mb-3 border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-red-600 flex items-center justify-center shadow-md">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Meu Perfil
                        </p>
                        <p className="text-xs text-gray-500">Gerencie sua conta</p>
                      </div>
                    </div>
                  </div>

                  <Link
                    to="/change-password"
                    className="flex items-center gap-3 px-4 py-3 mx-2 rounded-lg text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                    onClick={closeMobileMenu}
                  >
                    <KeyRound className="w-5 h-5" />
                    <span>Alterar Senha</span>
                  </Link>

                  <button
                    onClick={() => {
                      closeMobileMenu();
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 mx-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Sair</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
