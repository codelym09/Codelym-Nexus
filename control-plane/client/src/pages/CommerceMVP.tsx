import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  CreditCard,
  ExternalLink,
  Eye,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Package,
  Palette,
  Plus,
  Search,
  Settings2,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Truck,
  Users,
  X,
} from "lucide-react";

type View = "overview" | "products" | "orders" | "design" | "settings";
type Product = { id: number; name: string; category: string; price: number; stock: number; status: "Publicado" | "Borrador"; image: string; description: string };
type Order = { id: string; customer: string; total: number; status: "Pagado" | "Pendiente" | "En preparación" | "Enviado"; date: string; items: number };

const initialProducts: Product[] = [
  { id: 1, name: "Kit Ritual Esencial", category: "Rituales", price: 32800, stock: 18, status: "Publicado", image: "/store/ritual-hero.jpg", description: "Una selección simple para volver a lo esencial." },
  { id: 2, name: "Sérum Botánico", category: "Cuidado facial", price: 18900, stock: 24, status: "Publicado", image: "/store/serum.jpg", description: "Textura ligera y activos botánicos para todos los días." },
  { id: 3, name: "Limpieza Suave", category: "Cuidado facial", price: 12400, stock: 9, status: "Publicado", image: "/store/cleanse.jpg", description: "Limpieza delicada para empezar y terminar el día." },
  { id: 4, name: "Aceite de Noche", category: "Rituales", price: 15600, stock: 0, status: "Borrador", image: "/store/ritual.jpg", description: "Un ritual nocturno en tres gotas." },
];

const initialOrders: Order[] = [
  { id: "CN-1048", customer: "Sofía Martínez", total: 51700, status: "Pagado", date: "Hoy, 10:42", items: 2 },
  { id: "CN-1047", customer: "Valentina Ruiz", total: 32800, status: "En preparación", date: "Hoy, 09:18", items: 1 },
  { id: "CN-1046", customer: "Ana Belén", total: 18900, status: "Enviado", date: "Ayer, 18:06", items: 1 },
  { id: "CN-1045", customer: "Lucía Gómez", total: 28000, status: "Pendiente", date: "Ayer, 16:31", items: 2 },
];

const money = (amount: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(amount);
const statusClass: Record<Order["status"] | Product["status"], string> = {
  Pagado: "cn-status cn-status--green", "En preparación": "cn-status cn-status--orange", Enviado: "cn-status cn-status--blue", Pendiente: "cn-status cn-status--gray", Publicado: "cn-status cn-status--green", Borrador: "cn-status cn-status--gray",
};

function Logo() {
  return <div className="cn-brand"><span className="cn-brand-mark">cn</span><span>casa nómada</span></div>;
}

function Sidebar({ view, setView, mobileOpen, setMobileOpen }: { view: View; setView: (view: View) => void; mobileOpen: boolean; setMobileOpen: (open: boolean) => void }) {
  const items: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "overview", label: "Inicio", icon: LayoutDashboard },
    { id: "products", label: "Productos", icon: Package },
    { id: "orders", label: "Pedidos", icon: ShoppingBag },
    { id: "design", label: "Diseño de tienda", icon: Palette },
    { id: "settings", label: "Configuración", icon: Settings2 },
  ];
  return <aside className={`cn-sidebar ${mobileOpen ? "is-open" : ""}`}>
    <div className="cn-sidebar-top"><Logo /><button className="cn-icon-btn cn-mobile-close" onClick={() => setMobileOpen(false)}><X size={18} /></button></div>
    <div className="cn-store-switcher"><span className="cn-store-avatar">CN</span><span><strong>Casa Nómada</strong><small>Plan Inicial</small></span><ChevronDown size={14} /></div>
    <nav className="cn-nav">{items.map(({ id, label, icon: Icon }) => <button key={id} className={`cn-nav-item ${view === id ? "is-active" : ""}`} onClick={() => { setView(id); setMobileOpen(false); }}><Icon size={17} /><span>{label}</span>{id === "orders" && <b className="cn-nav-count">4</b>}</button>)}</nav>
    <div className="cn-sidebar-bottom"><div className="cn-help"><CircleHelp size={16} /><span>Centro de ayuda</span><ExternalLink size={13} /></div><div className="cn-user"><span className="cn-user-avatar">JP</span><span><strong>Juan Pérez</strong><small>Administrador</small></span><MoreHorizontal size={17} /></div></div>
  </aside>;
}

function Topbar({ view, onPreview, onToggleSidebar }: { view: View; onPreview: () => void; onToggleSidebar: () => void }) {
  const titles: Record<View, [string, string]> = { overview: ["Buenos días, Juan", "Esto es lo que está pasando en tu tienda."], products: ["Productos", "Gestiona tu catálogo y mantén tu stock al día."], orders: ["Pedidos", "Revisa, prepara y actualiza las ventas de tu tienda."], design: ["Diseño de tienda", "Dale a tu marca un espacio que se sienta propio."], settings: ["Configuración", "Completa los datos esenciales para empezar a vender."] };
  return <header className="cn-topbar"><button className="cn-icon-btn cn-menu-btn" onClick={onToggleSidebar}><Menu size={19} /></button><div><p className="cn-eyebrow">{view === "overview" ? "VISTA GENERAL" : "CASA NÓMADA"}</p><h1>{titles[view][0]}</h1><p className="cn-subtitle">{titles[view][1]}</p></div><div className="cn-top-actions"><button className="cn-preview-btn" onClick={onPreview}><Eye size={16} /> Ver tienda <ExternalLink size={13} /></button><button className="cn-icon-btn"><BellDot /></button></div></header>;
}
function BellDot() { return <span className="cn-bell"><span />⌁</span>; }

function Overview({ products, orders, setView, addProduct }: { products: Product[]; orders: Order[]; setView: (view: View) => void; addProduct: () => void }) {
  const published = products.filter((p) => p.status === "Publicado").length;
  return <div className="cn-content cn-overview">
    <section className="cn-hero-card"><div className="cn-hero-copy"><span className="cn-pill cn-pill--light"><Sparkles size={13} /> Tu tienda está tomando forma</span><h2>Haz espacio para<br /><em>lo esencial.</em></h2><p>Publica tu catálogo, recibe pedidos y deja que la operación fluya. Todo desde un solo lugar.</p><div className="cn-hero-actions"><button className="cn-btn cn-btn--dark" onClick={() => setView("products")}>Ver catálogo <ArrowRight size={16} /></button><button className="cn-text-btn" onClick={() => setView("design")}>Personalizar tienda <ChevronRight size={15} /></button></div></div><div className="cn-hero-image"><img src="/store/ritual-hero.jpg" alt="Productos de cuidado personal" /><span>RITUALES / 2026</span></div></section>
    <section className="cn-stat-grid"><Stat label="Ventas del mes" value="$ 184.900" delta="+12,8%" icon={BarChart3} tone="terracotta" /><Stat label="Pedidos" value="24" delta="+4 esta semana" icon={ShoppingBag} tone="sage" /><Stat label="Visitas" value="1.284" delta="+18,2%" icon={Users} tone="lilac" /><Stat label="Conversión" value="2,4%" delta="Buen ritmo" icon={Sparkles} tone="sand" /></section>
    <div className="cn-columns"><section className="cn-panel"><div className="cn-panel-head"><div><p className="cn-eyebrow">ACTIVIDAD RECIENTE</p><h3>Últimos pedidos</h3></div><button className="cn-link-btn" onClick={() => setView("orders")}>Ver todos <ArrowRight size={14} /></button></div><OrderTable orders={orders.slice(0, 3)} compact /></section><section className="cn-panel cn-checklist"><div className="cn-panel-head"><div><p className="cn-eyebrow">PUESTA A PUNTO</p><h3>Tu tienda, lista para vender</h3></div><span className="cn-progress-label">3 de 5</span></div><div className="cn-progress"><span style={{ width: "60%" }} /></div><ChecklistItem done text="Crea el nombre de tu tienda" /><ChecklistItem done text="Agrega tu primer producto" /><ChecklistItem done text="Elige una plantilla" /><ChecklistItem text="Configura medios de pago" onClick={() => setView("settings")} /><ChecklistItem text="Publica tu tienda" onClick={() => setView("design")} /><button className="cn-ghost-btn" onClick={() => addProduct()}><Plus size={15} /> Agregar producto</button></section></div>
    <section className="cn-channel-card"><div className="cn-channel-icon"><Store size={20} /></div><div><p className="cn-eyebrow">TU TIENDA ONLINE</p><h3>casanomada.casanomada.store</h3><p>Comparte este enlace para empezar a recibir visitas.</p></div><button className="cn-copy-btn">Copiar enlace</button></section>
  </div>;
}
function Stat({ label, value, delta, icon: Icon, tone }: { label: string; value: string; delta: string; icon: typeof BarChart3; tone: string }) { return <div className={`cn-stat cn-stat--${tone}`}><div className="cn-stat-icon"><Icon size={17} /></div><p>{label}</p><strong>{value}</strong><small>{delta}</small></div>; }
function ChecklistItem({ done, text, onClick }: { done?: boolean; text: string; onClick?: () => void }) { return <button className="cn-check-item" onClick={onClick}><span className={`cn-check ${done ? "is-done" : ""}`}>{done && <Check size={12} />}</span><span>{text}</span>{!done && <ChevronRight size={15} />}</button>; }
function OrderTable({ orders, compact }: { orders: Order[]; compact?: boolean }) { return <div className={`cn-mini-orders ${compact ? "is-compact" : ""}`}>{orders.map((order) => <div className="cn-mini-order" key={order.id}><span className="cn-mini-order-id"><strong>{order.id}</strong><small>{order.customer}</small></span><span className={statusClass[order.status]}>{order.status}</span><strong>{money(order.total)}</strong></div>)}</div>; }

function Products({ products, setProducts, onOpenCart, onAddProduct }: { products: Product[]; setProducts: (products: Product[]) => void; onOpenCart: (product: Product) => void; onAddProduct: () => void }) {
  const [query, setQuery] = useState("");
  const filtered = products.filter((p) => `${p.name} ${p.category}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="cn-content"><div className="cn-toolbar"><div className="cn-search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar productos..." /></div><div className="cn-toolbar-actions"><button className="cn-filter-btn">Todos <ChevronDown size={14} /></button><button className="cn-btn cn-btn--accent" onClick={onAddProduct}><Plus size={16} /> Nuevo producto</button></div></div><div className="cn-product-summary"><span><strong>{products.length}</strong> productos en tu catálogo</span><span><i className="cn-dot cn-dot--green" /> {products.filter((p) => p.status === "Publicado").length} publicados</span><span><i className="cn-dot cn-dot--orange" /> {products.filter((p) => p.stock > 0 && p.stock < 10).length} con stock bajo</span></div><div className="cn-product-grid">{filtered.map((product) => <article className="cn-product-card" key={product.id}><div className="cn-product-photo"><img src={product.image} alt={product.name} /><span className={statusClass[product.status]}>{product.status}</span><button className="cn-card-more"><MoreHorizontal size={16} /></button></div><div className="cn-product-info"><p className="cn-eyebrow">{product.category}</p><h3>{product.name}</h3><div className="cn-product-meta"><strong>{money(product.price)}</strong><span className={product.stock < 10 ? "cn-low-stock" : ""}>{product.stock === 0 ? "Sin stock" : `${product.stock} en stock`}</span></div><button className="cn-card-action" onClick={() => onOpenCart(product)}>{product.stock === 0 ? "Editar producto" : "Agregar al carrito"} <ArrowRight size={14} /></button></div></article>)}</div>{filtered.length === 0 && <div className="cn-empty"><Search size={28} /><h3>No encontramos productos</h3><p>Prueba con otra búsqueda.</p></div>}</div>;
}

function Orders({ orders, setOrders }: { orders: Order[]; setOrders: (orders: Order[]) => void }) { const [filter, setFilter] = useState("Todos"); const visible = orders.filter((order) => filter === "Todos" || order.status === filter); return <div className="cn-content"><div className="cn-toolbar"><div className="cn-filter-tabs">{["Todos", "Pendiente", "En preparación", "Enviado"].map((item) => <button className={filter === item ? "is-active" : ""} onClick={() => setFilter(item)} key={item}>{item}{item === "Pendiente" && <b>1</b>}</button>)}</div><button className="cn-filter-btn"><Truck size={15} /> Exportar pedidos</button></div><section className="cn-panel cn-orders-panel"><div className="cn-table-head"><span>Pedido</span><span>Cliente</span><span>Fecha</span><span>Estado</span><span>Total</span><span /></div><div className="cn-order-list">{visible.map((order) => <div className="cn-order-row" key={order.id}><div><strong>{order.id}</strong><small>{order.items} {order.items === 1 ? "producto" : "productos"}</small></div><span>{order.customer}</span><span className="cn-muted">{order.date}</span><span><button className={statusClass[order.status]} onClick={() => { const next: Order["status"] = order.status === "Pendiente" ? "En preparación" : order.status === "En preparación" ? "Enviado" : order.status; setOrders(orders.map((item) => item.id === order.id ? { ...item, status: next } : item)); }}>{order.status}</button></span><strong>{money(order.total)}</strong><button className="cn-icon-btn"><MoreHorizontal size={17} /></button></div>)}</div></section></div>; }

function Design({ onPublish }: { onPublish: () => void }) { const [template, setTemplate] = useState("Ritual"); return <div className="cn-content cn-design"><div className="cn-design-grid"><section className="cn-panel"><div className="cn-panel-head"><div><p className="cn-eyebrow">PLANTILLA</p><h3>Elige una base para tu tienda</h3></div><span className="cn-pill cn-pill--sage"><Check size={13} /> Guardado</span></div><div className="cn-template-grid">{["Ritual", "Arcilla", "Estudio"].map((name, index) => <button className={`cn-template ${template === name ? "is-selected" : ""}`} key={name} onClick={() => setTemplate(name)}><div className={`cn-template-preview cn-template-preview--${index + 1}`}><div /><span /><span /><span /></div><div><strong>{name}</strong><small>{template === name ? "En uso" : "Usar plantilla"}</small></div>{template === name && <span className="cn-template-check"><Check size={13} /></span>}</button>)}</div></section><section className="cn-panel cn-brand-panel"><div className="cn-panel-head"><div><p className="cn-eyebrow">IDENTIDAD</p><h3>Hazla tuya</h3></div><Palette size={18} className="cn-muted" /></div><label>Nombre de tienda<input defaultValue="Casa Nómada" /></label><label>Descripción corta<textarea defaultValue="Objetos para hacer espacio a lo esencial." /></label><div className="cn-color-row"><span>Color principal</span><button className="cn-color-choice"><i /> Terracota <ChevronDown size={14} /></button></div><button className="cn-btn cn-btn--dark cn-full" onClick={onPublish}>Publicar cambios <ArrowRight size={16} /></button></section></div><section className="cn-preview-store"><div className="cn-preview-browser"><span /><span /><span /><small>casanomada.casanomada.store</small></div><div className="cn-preview-content"><div className="cn-preview-nav"><Logo /><span>Rituales &nbsp; Cuidado facial &nbsp; Nuestra historia</span><ShoppingCart size={16} /></div><div className="cn-preview-hero"><div><p className="cn-eyebrow">RITUALES PARA TODOS LOS DÍAS</p><h2>Menos ruido.<br /><em>Más ritual.</em></h2><button className="cn-btn cn-btn--dark">Explorar productos <ArrowRight size={15} /></button></div><img src="/store/serum.jpg" alt="Vista previa del storefront" /></div></div></section></div>; }

function SettingsView() { return <div className="cn-content"><div className="cn-settings-grid"><section className="cn-panel"><div className="cn-panel-head"><div><p className="cn-eyebrow">INFORMACIÓN GENERAL</p><h3>Datos de tu tienda</h3></div><button className="cn-link-btn">Editar <ChevronRight size={14} /></button></div><label>Nombre comercial<input defaultValue="Casa Nómada" /></label><label>URL de tu tienda<div className="cn-input-prefix"><span>casanomada.</span><input defaultValue="casanomada.store" /></div></label><label>Email de contacto<input defaultValue="hola@casanomada.com" /></label></section><section className="cn-panel"><div className="cn-panel-head"><div><p className="cn-eyebrow">PAGOS Y ENVÍOS</p><h3>Configura cómo cobras</h3></div><CreditCard size={18} className="cn-muted" /></div><div className="cn-integration"><span className="cn-integration-logo cn-integration-logo--mp">mp</span><span><strong>Mercado Pago</strong><small>Recibe pagos con tarjetas y dinero en cuenta</small></span><button className="cn-switch is-on"><i /></button></div><div className="cn-integration"><span className="cn-integration-logo cn-integration-logo--truck"><Truck size={17} /></span><span><strong>Envío personalizado</strong><small>Tarifa fija · $ 2.500</small></span><button className="cn-switch is-on"><i /></button></div><button className="cn-ghost-btn cn-full"><Plus size={15} /> Agregar integración</button></section></div></div>; }

function CartDrawer({ cart, setCart, close, checkout }: { cart: Product[]; setCart: (products: Product[]) => void; close: () => void; checkout: () => void }) { const total = cart.reduce((sum, item) => sum + item.price, 0); return <div className="cn-overlay"><aside className="cn-cart-drawer"><div className="cn-drawer-head"><div><p className="cn-eyebrow">TU TIENDA</p><h2>Carrito</h2></div><button className="cn-icon-btn" onClick={close}><X size={18} /></button></div>{cart.length === 0 ? <div className="cn-cart-empty"><ShoppingCart size={32} /><h3>Tu carrito está vacío</h3><p>Agrega un producto para probar el checkout.</p></div> : <><div className="cn-cart-items">{cart.map((item, index) => <div className="cn-cart-item" key={`${item.id}-${index}`}><img src={item.image} alt="" /><div><strong>{item.name}</strong><small>{money(item.price)}</small></div><button onClick={() => setCart(cart.filter((_, i) => i !== index))}><X size={14} /></button></div>)}</div><div className="cn-cart-footer"><div><span>Subtotal</span><strong>{money(total)}</strong></div><small>Envío calculado en el checkout</small><button className="cn-btn cn-btn--accent cn-full" onClick={checkout}>Continuar al checkout <ArrowRight size={16} /></button></div></>}</aside></div>; }
function Checkout({ close, done }: { close: () => void; done: () => void }) { const [step, setStep] = useState(1); return <div className="cn-overlay"><div className="cn-checkout-modal"><div className="cn-drawer-head"><div><p className="cn-eyebrow">CHECKOUT DEMO</p><h2>{step === 3 ? "Pedido confirmado" : "Finaliza tu compra"}</h2></div><button className="cn-icon-btn" onClick={close}><X size={18} /></button></div>{step < 3 && <div className="cn-stepper"><span className={step >= 1 ? "is-current" : ""}>1 Datos</span><i /><span className={step >= 2 ? "is-current" : ""}>2 Pago</span><i /><span>3 Listo</span></div>}{step === 1 && <div className="cn-form"><label>Nombre completo<input placeholder="Tu nombre" /></label><label>Email<input placeholder="hola@ejemplo.com" /></label><label>Dirección de entrega<input placeholder="Calle y número" /></label><button className="cn-btn cn-btn--dark cn-full" onClick={() => setStep(2)}>Continuar al pago <ArrowRight size={16} /></button></div>}{step === 2 && <div className="cn-form"><div className="cn-demo-note"><CreditCard size={18} /><span>Modo demo activo<br /><small>Este pago no se procesa realmente.</small></span></div><label>Número de tarjeta<input placeholder="4242 4242 4242 4242" /></label><div className="cn-form-row"><label>Vencimiento<input placeholder="12/28" /></label><label>CVV<input placeholder="123" /></label></div><button className="cn-btn cn-btn--accent cn-full" onClick={() => setStep(3)}>Pagar $ 34.800 <Check size={16} /></button></div>}{step === 3 && <div className="cn-success"><span className="cn-success-icon"><Check size={25} /></span><p>Tu número de pedido es</p><strong>CN-1049</strong><small>Enviamos la confirmación a tu email.<br />Desde el panel puedes seguir cada estado.</small><button className="cn-btn cn-btn--dark" onClick={done}>Volver a la tienda <ArrowRight size={16} /></button></div>}</div></div>; }

export default function CommerceMVP() {
  useEffect(() => {
    document.title = "Casa Nómada · Tu tienda online";
  }, []);
  const [view, setView] = useState<View>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [products, setProducts] = useState(initialProducts);
  const [orders, setOrders] = useState(initialOrders);
  const [cart, setCart] = useState<Product[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const addProduct = () => { const newProduct: Product = { id: Date.now(), name: "Nuevo producto", category: "Nueva categoría", price: 9900, stock: 10, status: "Borrador", image: "/store/serum.jpg", description: "Completa la información de tu producto." }; setProducts([...products, newProduct]); setView("products"); setNotice("Producto creado como borrador"); setTimeout(() => setNotice(""), 2600); };
  const openCart = (product: Product) => { if (product.stock === 0) { setNotice("Este producto no tiene stock disponible"); setTimeout(() => setNotice(""), 2200); return; } setCart([...cart, product]); setCartOpen(true); };
  const content = useMemo(() => { if (view === "overview") return <Overview products={products} orders={orders} setView={setView} addProduct={addProduct} />; if (view === "products") return <Products products={products} setProducts={setProducts} onOpenCart={openCart} onAddProduct={addProduct} />; if (view === "orders") return <Orders orders={orders} setOrders={setOrders} />; if (view === "design") return <Design onPublish={() => { setNotice("Cambios publicados en tu tienda"); setTimeout(() => setNotice(""), 2600); }} />; return <SettingsView />; }, [view, products, orders, cart]);
  return <div className="cn-app"><Sidebar view={view} setView={setView} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} /><main className="cn-main"><Topbar view={view} onToggleSidebar={() => setMobileOpen(!mobileOpen)} onPreview={() => { setView("design"); setNotice("Vista previa lista"); setTimeout(() => setNotice(""), 2200); }} />{content}</main>{cartOpen && <CartDrawer cart={cart} setCart={setCart} close={() => setCartOpen(false)} checkout={() => { setCartOpen(false); setCheckoutOpen(true); }} />}{checkoutOpen && <Checkout close={() => setCheckoutOpen(false)} done={() => { setCheckoutOpen(false); setCart([]); setView("orders"); setNotice("Pedido CN-1049 creado correctamente"); setTimeout(() => setNotice(""), 2600); }} />}{notice && <div className="cn-toast"><Check size={16} />{notice}</div>}</div>;
}
