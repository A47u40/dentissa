from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'usuarios', views.UsuarioViewSet, basename='usuarios')
router.register(r'citas', views.CitaViewSet, basename='citas')
router.register(r'promociones', views.PromocionViewSet, basename='promociones')
router.register(r'casos-exito', views.CasoExitoViewSet, basename='casos-exito')
router.register(r'faqs', views.PreguntaFrecuenteViewSet, basename='faqs')
router.register(r'servicios', views.ServicioViewSet, basename='servicios')

urlpatterns = [
    # Auth
    path('auth/register/', views.register_view, name='register'),
    path('auth/login/', views.login_view, name='login'),
    path('auth/me/', views.me_view, name='me'),

    # Perfil
    path('perfil-paciente/<int:usuario_id>/', views.perfil_paciente_view, name='perfil-paciente'),
    path('perfil-especialista/<int:usuario_id>/', views.perfil_especialista_view, name='perfil-especialista'),

    # Especialistas
    path('especialistas/', views.especialistas_list, name='especialistas'),

    # Estadísticas
    path('estadisticas/', views.estadisticas_view, name='estadisticas'),

    # Notificaciones
    path('notificaciones/', views.notificaciones_list, name='notificaciones'),
    path('notificaciones/enviar/', views.enviar_recordatorio_manual, name='enviar-recordatorio'),

    # Router (usuarios, citas, promociones, casos-exito, faqs)
    path('', include(router.urls)),
]
