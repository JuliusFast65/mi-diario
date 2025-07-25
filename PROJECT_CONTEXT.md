# Contexto del Proyecto: Introspect - Diario Personal

## 📋 Información General

**Nombre del Proyecto:** Introspect - Tu Diario Personal  
**Versión:** 1.60.0  
**Tecnologías:** React 19, Vite, Firebase, Tailwind CSS  
**Tipo:** PWA (Progressive Web App) con funcionalidades premium

## 🎯 Propósito

Aplicación de diario personal que permite a los usuarios:
- Escribir entradas de diario con encriptación
- Definir y rastrear actividades/hábitos
- Analizar patrones de comportamiento
- Acceder a funcionalidades premium como IA y análisis avanzado

## 🏗️ Arquitectura del Proyecto

### Estructura de Directorios
```
mi-diario/
├── src/
│   ├── components/          # Componentes React
│   ├── hooks/              # Custom hooks
│   ├── utils/              # Utilidades (crypto, payment)
│   ├── firebase/           # Configuración Firebase
│   ├── App.jsx            # Componente principal
│   └── main.jsx           # Punto de entrada
├── public/                # Archivos estáticos y PWA
├── scripts/               # Scripts de build
└── dist/                  # Build de producción
```

### Tecnologías Principales
- **Frontend:** React 19 + Vite
- **Styling:** Tailwind CSS + Google Fonts
- **Backend:** Firebase (Auth, Firestore)
- **Pagos:** Stripe
- **PWA:** Service Worker + Manifest
- **Encriptación:** Crypto.js

## 🔐 Sistema de Autenticación

- **Proveedor:** Google Auth (Firebase)
- **Almacenamiento:** Firestore con estructura de usuarios
- **Encriptación:** Texto encriptado con clave del usuario

## 💰 Modelo de Suscripción

### Plan Gratuito (Free)
- ✅ Entradas de diario ilimitadas
- ✅ Definir actividades ilimitadas
- ✅ Rastrear hasta 3 actividades por día
- ✅ Actividades simples (1 punto por actividad)
- ✅ Exportar/Importar entradas
- ✅ Estadísticas básicas

### Plan Premium
- ✅ Todo del plan gratuito
- ✅ Rastrear actividades ilimitadas por día
- ✅ Subniveles de actividades con puntos personalizados
- ✅ Metas y objetivos configurables
- ✅ Chat con IA terapéutica
- ✅ Asistente de escritura
- ✅ Análisis de comportamiento avanzado
- ✅ Autenticación de dos factores
- ✅ Estadísticas avanzadas

## 📊 Estructura de Datos

### Firestore Collections
```
artifacts/{appId}/
├── users/{userId}/
│   ├── entries/{date}          # Entradas del diario
│   ├── activities/{activityId} # Actividades definidas
│   └── subscription            # Estado de suscripción
```

### Entrada de Diario
```javascript
{
  title: "string (encriptado)",
  text: "string (encriptado)",
  tracked: {
    activityId: "selectedOption"
  },
  createdAt: "timestamp"
}
```

### Actividad
```javascript
{
  name: "string",
  options: ["array"],           // Solo premium
  points: {option: points},     // Solo premium
  goal: {                       // Solo premium
    type: "weekly|monthly|custom",
    target: number,
    startDate: "date",
    endDate: "date"
  },
  isSimple: boolean,            // Para usuarios gratuitos
  originalOptions: ["array"],   // Datos preservados para free
  originalPoints: object        // Datos preservados para free
}
```

## 🎨 Componentes Principales

### Core Components
- `DiaryEntryEditor` - Editor principal del diario
- `ActivityTrackerItem` - Rastreador de actividades
- `CreateActivityModal` - Crear/editar actividades
- `StatisticsPanel` - Panel de estadísticas

### Premium Components
- `TherapistChat` - Chat con IA terapéutica
- `WritingAssistant` - Asistente de escritura
- `BehaviorAnalysis` - Análisis de comportamiento
- `TwoFactorAuth` - Autenticación de dos factores
- `SubscriptionModal` - Gestión de suscripciones

### Utility Components
- `ArchiveView` - Vista de archivo
- `ExportModal` - Exportar entradas
- `ImportModal` - Importar entradas
- `Onboarding` - Tutorial inicial

## 🔧 Hooks Personalizados

### `useActivities`
- Gestión de actividades del usuario
- Lógica de plan gratuito vs premium
- CRUD de actividades y opciones

### `useDiary`
- Gestión de entradas del diario
- Encriptación/desencriptación
- Carga y guardado de entradas

### `useSubscription`
- Estado de suscripción del usuario
- Verificación de características premium
- Integración con Stripe

## 🔒 Seguridad y Privacidad

- **Encriptación:** Todo el texto del usuario está encriptado
- **Clave:** Derivada del UID del usuario
- **Almacenamiento:** Solo datos encriptados en Firestore
- **Autenticación:** Google OAuth con Firebase

## 📱 PWA Features

- **Service Worker:** Cache inteligente y actualizaciones
- **Manifest:** Instalación como app nativa
- **Offline:** Funcionalidad básica offline
- **Notificaciones:** Actualizaciones de la app

## 🎯 Funcionalidades Clave

### Sistema de Actividades
- **Gratuito:** Actividades simples (sí/no, 1 punto)
- **Premium:** Subniveles con puntos personalizados
- **Metas:** Objetivos configurables (solo premium)

### Análisis y Estadísticas
- **Gratuito:** Estadísticas básicas de actividades
- **Premium:** Análisis avanzado de patrones

### IA y Asistencia
- **Chat Terapéutico:** IA para apoyo emocional
- **Asistente de Escritura:** Sugerencias de escritura
- **Análisis de Comportamiento:** Patrones y insights

## 🚀 Scripts Disponibles

```bash
npm run dev          # Desarrollo
npm run build        # Build de producción
npm run preview      # Preview del build
npm run lint         # Linting
```

## 🔧 Configuración

### Variables de Entorno Requeridas
```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

### Firebase Configuration
- **Auth:** Google Sign-in
- **Firestore:** Base de datos principal
- **Hosting:** Despliegue en Firebase Hosting

## 📈 Estado Actual del Proyecto

- ✅ Sistema de autenticación completo
- ✅ Editor de diario funcional
- ✅ Sistema de actividades con límites
- ✅ Funcionalidades premium implementadas
- ✅ PWA completamente funcional
- ✅ Sistema de suscripciones con Stripe
- ✅ Encriptación de datos
- ✅ Export/Import de entradas

## 🎨 UI/UX

- **Diseño:** Moderno y minimalista
- **Tema:** Dark mode por defecto
- **Fuentes:** Google Fonts (Patrick Hand, Caveat, etc.)
- **Responsive:** Mobile-first design
- **Accesibilidad:** Navegación por teclado y lectores de pantalla

## 🔄 Flujo de Usuario

1. **Onboarding:** Tutorial inicial para nuevos usuarios
2. **Definir Actividades:** Configurar hábitos a rastrear
3. **Escribir Diario:** Entradas diarias con texto encriptado
4. **Rastrear Actividades:** Registrar progreso de hábitos
5. **Analizar:** Ver estadísticas y patrones
6. **Premium:** Desbloquear funcionalidades avanzadas

## 📝 Notas de Desarrollo

- El proyecto usa React 19 con las últimas características
- Implementación de PWA con Service Worker
- Sistema de suscripciones integrado con Stripe
- Encriptación end-to-end para privacidad del usuario
- Arquitectura modular con hooks personalizados
- Soporte completo para modo offline

---

**Última actualización:** Diciembre 2024  
**Versión del documento:** 1.0 