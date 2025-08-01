# Contexto del Proyecto: Introspect - Diario Personal

## 📋 Información General

**Nombre del Proyecto:** Introspect - Tu Diario Personal  
**Versión:** 1.68.0  
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
- ✅ Personalización de IA (estilos terapéuticos, asistentes de escritura, tonos motivacionales)

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
- `BasicWritingAssistant` - Asistente de escritura básico con sugerencias inteligentes

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
- **`package.json`**: Versión del proyecto (1.68.0)
- **`src/config/version.js`**: Versión centralizada de la aplicación (1.68)
- **`APP_VERSION`**: Versión visible al usuario (1.68) - Importada desde config/version.js
- **`SW_VERSION`**: Versión del Service Worker (2.0.141)

El script `prebuild` actualiza automáticamente la versión del Service Worker cuando cambia la versión en `package.json`.

#### Sistema de Versiones Centralizado
Para evitar duplicaciones y mantener consistencia, la versión se define en un solo lugar:
- **`src/config/version.js`**: Archivo centralizado con todas las versiones
- **Importación**: Todos los componentes importan `APP_VERSION` desde este archivo
- **Beneficios**: 
  - Una sola fuente de verdad para la versión
  - Fácil actualización (solo cambiar en un lugar)
  - Evita inconsistencias entre archivos

## 🎯 Funcionalidades Clave

### Sistema de Actividades
- **Gratuito:** Actividades simples (sí/no, 1 punto)
- **Premium:** Subniveles con puntos personalizados
- **Metas:** Objetivos configurables (solo premium)

### Análisis y Estadísticas
- **Gratuito:** Estadísticas básicas de actividades
- **Premium:** Análisis avanzado de patrones

### IA y Asistencia
- **Chat Terapéutico:** IA para apoyo emocional con estilos personalizables
- **Asistente de Escritura Básico:** 
  - **Entradas vacías:** Sugerencias motivadoras para comenzar a escribir, preguntas reflexivas, temas de escritura y técnicas para superar el bloqueo
  - **Entradas con contenido:** Mejora gramática, ortografía y flujo del texto
  - **Estilos personalizables:** Adapta sugerencias según el estilo preferido del usuario
- **Asistente de Escritura Avanzado:** Funcionalidades premium de escritura con personalización
- **Análisis de Comportamiento:** Patrones y insights
- **Reflexión Terapéutica:** Análisis de entradas con estilo terapéutico personalizable
- **Mensajes Inspiracionales:** Generación de mensajes motivacionales con tonos personalizables

### 🤖 Personalización de IA (Premium)

El sistema de IA personalizable permite a los usuarios adaptar la experiencia de IA según sus preferencias personales:

#### **Estilos Terapéuticos** (`therapistStyle`)
- **Empático:** Enfoque cálido y comprensivo, prioriza la validación emocional
- **Directo:** Comunicación clara y orientada a soluciones prácticas
- **Analítico:** Análisis profundo de patrones y comportamientos
- **Mindfulness:** Enfoque en presencia, respiración y conciencia plena
- **Cognitivo:** Trabajo con pensamientos, creencias y reestructuración cognitiva
- **Sistémico:** Considera el contexto familiar y relacional
- **Humanista:** Enfoque en el crecimiento personal y la autorrealización

#### **Estilos de Asistente de Escritura** (`writingAssistantStyle`)
- **Creativo:** Sugerencias artísticas y expresivas, fomenta la creatividad
- **Estructurado:** Enfoque organizado y metódico, mejora la claridad
- **Emocional:** Prioriza la expresión de sentimientos y experiencias personales
- **Analítico:** Análisis reflexivo y pensamiento crítico
- **Narrativo:** Desarrollo de historias y secuencias temporales
- **Descriptivo:** Enfoque en detalles sensoriales y observaciones
- **Filosófico:** Reflexiones profundas y contemplativas

#### **Tonos Motivacionales** (`motivationalTone`)
- **Espiritual:** Sabiduría trascendental y conexión con lo divino
- **Filosófico:** Reflexión profunda y pensamiento crítico
- **Motivacional:** Energía y empuje para la acción
- **Mindfulness:** Presencia y conciencia del momento actual
- **Científico:** Enfoque racional y basado en evidencia
- **Poético:** Belleza artística y expresión creativa
- **Práctico:** Consejos aplicables y orientados a resultados

#### **Componentes que Utilizan la Personalización**
- **`AdvancedIntrospectiveAssistant`:** Adapta el estilo terapéutico del chat
- **`TherapistReflection`:** Personaliza el análisis de entradas
- **`BasicWritingAssistant`:** Ajusta sugerencias según el estilo de escritura
- **`WritingAssistant`:** Personaliza prompts y sugerencias avanzadas
- **`handleInspirationalMessage`:** Genera mensajes con el tono motivacional preferido

#### **Almacenamiento de Preferencias**
Las preferencias se almacenan en el perfil del usuario en Firestore y se pasan como props a todos los componentes de IA para asegurar consistencia en la experiencia del usuario.

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
2. **Incremento de Versión** → Actualizar `package.json` y `src/config/version.js`
3. **Build** → `npm run build`
4. **Despliegue** → `firebase deploy`
5. **Commit** → `git add . && git commit -m "mensaje"`
6. **Push** → `git push`

### ¿Por qué este orden?

#### 1. **Incremento de Versión Primero**
- Actualiza la versión antes de cualquier build
- Asegura que el Service Worker se actualice con la nueva versión
- Mantiene sincronizados `package.json` y `src/config/version.js`
- Facilita el seguimiento de cambios en producción

#### 2. **Build Después del Incremento**
- Verifica que el código compile sin errores
- Actualiza automáticamente el Service Worker con la nueva versión
- Genera los archivos optimizados para producción
- Detecta problemas antes del despliegue

#### 3. **Despliegue Antes del Commit**
- Asegura que los cambios funcionen en producción
- Permite probar la app desplegada antes de guardar en git
- Si hay problemas, se pueden corregir antes del commit
- Evita commits con código que no funciona en producción

#### 4. **Commit Final**
- Solo se hace commit del código que ya está funcionando
- El historial de git refleja el estado real de producción
- Facilita el rollback si es necesario

#### 5. **Push al Repositorio**
- Sincroniza los cambios con el repositorio remoto
- Permite colaboración en equipo
- Crea backup del código en la nube
- Facilita el deployment en otros entornos

### Comandos del Flujo
```bash
# 1. Desarrollo (en paralelo)
npm run dev

# 2. Incremento de versión
# - Actualizar "version" en package.json (ej: "1.68.0")
# - Actualizar APP_VERSION en src/config/version.js (ej: '1.68')

# 3. Build y verificación
npm run build

# 4. Despliegue a Firebase
firebase deploy

# 5. Commit de cambios
git add .
git commit -m "feat: descripción de cambios"

# 6. Push al repositorio
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
- ✅ Asistente de escritura básico mejorado con sugerencias inteligentes

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

## 🆕 Mejoras Recientes

### Sistema de Personalización de IA (Diciembre 2024)
Implementación completa de personalización de IA que permite a los usuarios adaptar todas las funcionalidades de IA según sus preferencias personales:

#### **Características Implementadas:**
- **3 Tipos de Personalización:** Estilos terapéuticos, estilos de escritura y tonos motivacionales
- **7 Opciones por Categoría:** Cada tipo ofrece 7 estilos diferentes para máxima personalización
- **Integración Completa:** Todos los componentes de IA adaptan su comportamiento según las preferencias
- **Experiencia Consistente:** Las preferencias se aplican uniformemente en toda la aplicación

#### **Componentes Actualizados:**
- **`AdvancedIntrospectiveAssistant`:** Chat terapéutico con estilos personalizables
- **`TherapistReflection`:** Análisis de entradas con enfoque terapéutico adaptativo
- **`BasicWritingAssistant`:** Sugerencias de escritura según el estilo preferido
- **`WritingAssistant`:** Funcionalidades avanzadas con personalización
- **`handleInspirationalMessage`:** Mensajes motivacionales con tonos personalizables

#### **Beneficios de la Personalización:**
- **Experiencia Única:** Cada usuario puede adaptar la IA a su estilo personal
- **Mayor Engagement:** La IA se siente más personal y relevante
- **Flexibilidad Terapéutica:** Diferentes enfoques para diferentes necesidades
- **Escritura Personalizada:** Sugerencias que se alinean con el estilo del usuario

### Asistente de Escritura Básico Mejorado (Diciembre 2024)
El asistente de escritura básico ahora proporciona ayuda inteligente según el estado de la entrada:

#### **Para Entradas Vacías:**
- **Sugerencias motivadoras** para comenzar a escribir
- **Preguntas reflexivas** (3-4) que ayudan a explorar pensamientos y sentimientos
- **Temas de escritura** (2-3 ideas) como punto de partida
- **Técnicas de escritura** (2-3 consejos) para superar el bloqueo del escritor
- **Ejemplo breve** de cómo comenzar una entrada de diario
- **Tono cálido y empático** para motivar al usuario

#### **Para Entradas con Contenido:**
- **Corrección de gramática y ortografía**
- **Mejora del flujo del texto**
- **Mantenimiento de la voz del autor**
- **Versión mejorada aplicable** con botón "Aplicar Sugerencia"

#### **Beneficios de la Mejora:**
- **Experiencia adaptativa:** Diferentes tipos de ayuda según el contexto
- **Reducción del bloqueo:** Ayuda específica para usuarios que no saben por dónde empezar
- **Mejora continua:** Mantiene la funcionalidad de mejora para usuarios experimentados
- **Interfaz clara:** Títulos y mensajes que cambian según el estado de la entrada

---

**Última actualización:** Diciembre 2024  
**Versión del documento:** 1.3 