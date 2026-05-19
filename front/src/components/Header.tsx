import { Link, useLocation, useNavigate } from "react-router";
import {
  Menu,
  X,
  Terminal,
  LogOut,
  KeyRound,
  User,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import Notification from "./Notification";
import { useUser } from "@/context/UserContext";

interface NavigationItem {
  to?: string;
  label: string;
  submenu?: { to: string; label: string }[];
}

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser } = useUser();

  const isAdmin = user?.roles?.includes("admin") || false;
  const isProfessor = user?.roles?.includes("professor") || false;

  const navigationItems: NavigationItem[] = [
    { to: "/home", label: "Dashboard" },
    { to: "/activities", label: "Atividades" },
    { to: "/submissions", label: "Submissões" },
    { to: "/classes", label: "Turmas" },
    ...(isAdmin
      ? [
          {
            label: "Gerenciar",
            submenu: [
              { to: "/students", label: "Alunos" },
              { to: "/teachers", label: "Professores" },
              { to: "/monitoring", label: "Monitoramento" },
            ],
          },
        ]
      : []),
    ...(isAdmin || isProfessor
      ? [
          {
            label: "Problemas",
            submenu: [{ to: "/problems", label: "Gerenciar Problemas" }],
          },
        ]
      : []),
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const isActiveRoute = (path: string) => location.pathname === path;
  const isActiveGroup = (item: NavigationItem) =>
    item.submenu?.some((sub) => isActiveRoute(sub.to)) || false;

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileMenuOpen]);

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
      setUser(null);
      navigate("/login");
    } catch {
      setError("Erro ao fazer logout");
    }
  }

  const handleDropdownEnter = (label: string) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setOpenDropdown(label);
  };

  const handleDropdownLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => setOpenDropdown(null), 150);
  };

  const userInitial = user?.name?.charAt(0).toUpperCase() || "U";

  return (
    <>
      {error && (
        <Notification
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}
      <header className="sticky top-0 z-50 bg-white border-b border-stone-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14">

            {/* Logo + Nav */}
            <Link
              to="/home"
              className="flex items-center gap-2 shrink-0"
              onClick={closeMobileMenu}
            >
              <div className="w-7 h-7 rounded-md bg-stone-900 flex items-center justify-center">
                <Terminal className="h-4 w-4 text-white" />
              </div>
              <span className="text-stone-900 text-base font-bold tracking-tight">
                IFCodes
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1 ml-8">
              {navigationItems.map((item) =>
                item.submenu ? (
                  <div
                    key={item.label}
                    className="relative"
                    onMouseEnter={() => handleDropdownEnter(item.label)}
                    onMouseLeave={handleDropdownLeave}
                  >
                    <button
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        isActiveGroup(item)
                          ? "text-teal-700 bg-teal-50"
                          : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                      }`}
                    >
                      {item.label}
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-150 ${
                          openDropdown === item.label ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {openDropdown === item.label && (
                      <div className="absolute left-0 top-full pt-1 z-50">
                        <div className="bg-white border border-stone-200 rounded-lg shadow-lg py-1 min-w-[180px]">
                          {item.submenu.map((sub) => (
                            <Link
                              key={sub.to}
                              to={sub.to}
                              className={`block px-3 py-2 text-sm transition-colors ${
                                isActiveRoute(sub.to)
                                  ? "text-teal-700 bg-teal-50 font-medium"
                                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"
                              }`}
                              onClick={() => setOpenDropdown(null)}
                            >
                              {sub.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    key={item.label}
                    to={item.to!}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      isActiveRoute(item.to!)
                        ? "text-teal-700 bg-teal-50"
                        : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              )}
            </nav>

            {/* Desktop profile */}
            <div className="hidden md:flex items-center ml-auto relative" ref={profileMenuRef}>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-stone-100 transition-colors"
                aria-expanded={isProfileMenuOpen}
                aria-haspopup="true"
              >
                <div className="w-7 h-7 rounded-md bg-teal-600 flex items-center justify-center text-white text-xs font-bold">
                  {userInitial}
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-150 ${
                    isProfileMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-lg shadow-lg border border-stone-200 py-1 z-50">
                  <div className="px-3 py-2 border-b border-stone-100">
                    <p className="text-sm font-medium text-stone-900 truncate">
                      {user?.name || "Usuário"}
                    </p>
                    <p className="text-xs text-stone-400 truncate mt-0.5">
                      {user?.email || ""}
                    </p>
                  </div>
                  <div className="py-1">
                    <Link
                      to="/perfil"
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      Meu Perfil
                    </Link>
                    <Link
                      to="/change-password"
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <KeyRound className="w-4 h-4" />
                      Alterar Senha
                    </Link>
                  </div>
                  <div className="border-t border-stone-100 py-1">
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden ml-auto p-2 rounded-md text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
              aria-expanded={isMobileMenuOpen}
              aria-label="Menu de navegação"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay — rendered outside header so it doesn't push content */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-14 z-40 bg-white overflow-y-auto">
          <div className="px-4 py-3 space-y-1">
            {navigationItems.map((item) => (
              <div key={item.label}>
                {item.submenu ? (
                  <>
                    <button
                      onClick={() =>
                        setOpenDropdown(
                          openDropdown === item.label ? null : item.label
                        )
                      }
                      className={`flex items-center justify-between w-full px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                        isActiveGroup(item)
                          ? "text-teal-700 bg-teal-50"
                          : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"
                      }`}
                    >
                      {item.label}
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-150 ${
                          openDropdown === item.label ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-200 ${
                        openDropdown === item.label ? "max-h-40" : "max-h-0"
                      }`}
                    >
                      <div className="pl-3 py-1 space-y-0.5">
                        {item.submenu.map((sub) => (
                          <Link
                            key={sub.to}
                            to={sub.to}
                            className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                              isActiveRoute(sub.to)
                                ? "text-teal-700 bg-teal-50 font-medium"
                                : "text-stone-500 hover:text-stone-900 hover:bg-stone-50"
                            }`}
                            onClick={closeMobileMenu}
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <Link
                    to={item.to!}
                    className={`block px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                      isActiveRoute(item.to!)
                        ? "text-teal-700 bg-teal-50"
                        : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"
                    }`}
                    onClick={closeMobileMenu}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}

            {/* Mobile profile section */}
            <div className="border-t border-stone-100 pt-3 mt-3 space-y-1">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-8 h-8 rounded-md bg-teal-600 flex items-center justify-center text-white text-sm font-bold">
                  {userInitial}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-900 truncate">
                    {user?.name || "Usuário"}
                  </p>
                  <p className="text-xs text-stone-400 truncate">
                    {user?.email || ""}
                  </p>
                </div>
              </div>

              <Link
                to="/perfil"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors"
                onClick={closeMobileMenu}
              >
                <User className="w-4 h-4" />
                Meu Perfil
              </Link>
              <Link
                to="/change-password"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors"
                onClick={closeMobileMenu}
              >
                <KeyRound className="w-4 h-4" />
                Alterar Senha
              </Link>
              <button
                onClick={() => {
                  closeMobileMenu();
                  handleLogout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
