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

## 📱 PWA (Progressive Web App)

### Configuración PWA
La aplicación está configurada como PWA completa para permitir instalación en dispositivos móviles y desktop.

#### Archivos PWA
- **`public/manifest.json`**: Configuración de la app instalable
- **`public/sw.js`**: Service Worker para cache y actualizaciones
- **`index.html`**: Meta tags y registro del Service Worker
- **Iconos**: `pwa-192x192.png`, `pwa-512x512.png`, `favicon.svg`

#### Características PWA
- ✅ **Instalable**: Se puede instalar como app nativa
- ✅ **Offline**: Funcionalidad básica sin conexión
- ✅ **Actualizaciones automáticas**: Service Worker detecta cambios
- ✅ **Cache inteligente**: Recursos cacheados para mejor rendimiento
- ✅ **Notificaciones push**: Preparado para notificaciones (futuro)

#### Criterios de Instalación
Para que el navegador muestre el prompt de instalación, la app debe cumplir:
- ✅ **HTTPS**: Desplegada en Firebase Hosting
- ✅ **Manifest válido**: Con todos los campos requeridos
- ✅ **Service Worker registrado**: En `index.html`
- ✅ **Iconos**: 192x192 y 512x512 píxeles
- ✅ **Meta tags PWA**: Para todos los navegadores
- ✅ **Display standalone**: Se abre como app nativa

#### Versiones y Actualizaciones
- **`package.json`**: Versión del proyecto (1.61.0)
- **`APP_VERSION`**: Versión visible al usuario (1.61)
- **`SW_VERSION`**: Versión del Service Worker (2.0.141)

El script `prebuild` actualiza automáticamente la versión del Service Worker cuando cambia la versión en `package.json`.

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

## 🔄 Flujo de Trabajo de Desarrollo

### Ciclo de Desarrollo Estándar
Para mantener la consistencia y asegurar despliegues exitosos, seguir este orden:

1. **Desarrollo** → `npm run dev`
2. **Build** → `npm run build`
3. **Despliegue** → `firebase deploy`
4. **Commit** → `git add . && git commit -m "mensaje"`
5. **Push** → `git push`

### ¿Por qué este orden?

#### 1. **Build Primero**
- Verifica que el código compile sin errores
- Actualiza automáticamente el Service Worker
- Genera los archivos optimizados para producción
- Detecta problemas antes del despliegue

#### 2. **Despliegue Antes del Commit**
- Asegura que los cambios funcionen en producción
- Permite probar la app desplegada antes de guardar en git
- Si hay problemas, se pueden corregir antes del commit
- Evita commits con código que no funciona en producción

#### 3. **Commit Final**
- Solo se hace commit del código que ya está funcionando
- El historial de git refleja el estado real de producción
- Facilita el rollback si es necesario

#### 4. **Push al Repositorio**
- Sincroniza los cambios con el repositorio remoto
- Permite colaboración en equipo
- Crea backup del código en la nube
- Facilita el deployment en otros entornos

### Comandos del Flujo
```bash
# 1. Desarrollo (en paralelo)
npm run dev

# 2. Build y verificación
npm run build

# 3. Despliegue a Firebase
firebase deploy

# 4. Commit de cambios
git add .
git commit -m "feat: descripción de cambios"

# 5. Push al repositorio
git push
```

### Scripts Automatizados
- **`prebuild`**: Actualiza automáticamente la versión del Service Worker
- **Service Worker**: Se actualiza con cada build
- **Firebase**: Despliega automáticamente a hosting y Firestore

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
**Versión del documento:** 1.1 