# Introspect - Tu Diario Personal

![Introspect Logo](public/favicon.svg)

Una aplicación de diario personal moderna y segura con funcionalidades premium, construida con React y Firebase.

## ✨ Características

### 🆓 Plan Gratuito
- 📝 Entradas de diario ilimitadas con encriptación
- 🎯 Definir actividades ilimitadas
- 📊 Rastrear hasta 3 actividades por día
- 📈 Estadísticas básicas
- 📤 Exportar/Importar entradas

### ⭐ Plan Premium
- 🚀 Todo del plan gratuito
- 📊 Actividades ilimitadas por día
- 🎯 Subniveles con puntos personalizados
- 🎯 Metas y objetivos configurables
- 🤖 Chat con IA terapéutica
- ✍️ Asistente de escritura
- 📊 Análisis de comportamiento avanzado
- 🔐 Autenticación de dos factores

## 🚀 Instalación

```bash
# Clonar el repositorio
git clone [URL_DEL_REPO]
cd mi-diario

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Firebase

# Ejecutar en desarrollo
npm run dev

# Build para producción
npm run build
```

## 🔧 Configuración

### Variables de Entorno Requeridas

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto_id
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
```

### Configuración de Firebase

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com)
2. Habilita Authentication con Google Sign-in
3. Crea una base de datos Firestore
4. Configura las reglas de seguridad
5. Copia las credenciales a tu archivo `.env`

## 🏗️ Tecnologías

- **Frontend:** React 19 + Vite
- **Styling:** Tailwind CSS + Google Fonts
- **Backend:** Firebase (Auth, Firestore)
- **Pagos:** Stripe
- **PWA:** Service Worker + Manifest
- **Encriptación:** Crypto.js

## 📱 PWA Features

- ✅ Instalable como app nativa
- ✅ Funcionamiento offline
- ✅ Notificaciones push
- ✅ Actualizaciones automáticas

## 🔒 Seguridad

- 🔐 Encriptación end-to-end de todas las entradas
- 🔑 Claves derivadas del UID del usuario
- 🛡️ Autenticación Google OAuth
- 🔒 Datos encriptados en Firestore

## 📊 Estructura del Proyecto

```
src/
├── components/          # Componentes React
├── hooks/              # Custom hooks
├── utils/              # Utilidades (crypto, payment)
├── firebase/           # Configuración Firebase
├── App.jsx            # Componente principal
└── main.jsx           # Punto de entrada
```

## 🚀 Scripts Disponibles

```bash
npm run dev          # Desarrollo
npm run build        # Build de producción
npm run preview      # Preview del build
npm run lint         # Linting
```

## 📖 Documentación

Para información técnica detallada, consulta:
- [`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md) - Contexto completo del proyecto
- [`PWA_UPDATE_GUIDE.md`](./PWA_UPDATE_GUIDE.md) - Guía de actualizaciones PWA

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:
- Abre un issue en GitHub
- Revisa la documentación en `PROJECT_CONTEXT.md`
- Contacta al equipo de desarrollo

---

**Desarrollado con ❤️ para ayudar a las personas a reflexionar y crecer personalmente.**
