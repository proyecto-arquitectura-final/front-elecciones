import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { DashboardPublic } from './pages/dashboard-public/dashboard-public';
import { PublicPredictions } from './pages/public-predictions/public-predictions';
import { PublicAssistant } from './pages/public-assistant/public-assistant';

import { AdminLayout } from './pages/admin/admin-layout/admin-layout';
import { DashboardAdmin } from './pages/admin/dashboard-admin/dashboard-admin';
import { Partidos } from './pages/admin/partidos/partidos';
import { Candidatos } from './pages/admin/candidatos/candidatos';
import { Elecciones } from './pages/admin/elecciones/elecciones';
import { Encuestas } from './pages/admin/encuestas/encuestas';
import { Resultados } from './pages/admin/resultados/resultados';
import { Reportes } from './pages/admin/reportes/reportes';
import { Usuarios } from './pages/admin/usuarios/usuarios';
import { Auditoria } from './pages/admin/auditoria/auditoria';

import { AnalistaLayout } from './pages/analista/analista-layout/analista-layout';
import { DashboardAnalista } from './pages/analista/dashboard-analista/dashboard-analista';
import { CandidatosAnalista } from './pages/analista/candidatos-analista/candidatos-analista';
import { PartidosAnalista } from './pages/analista/partidos-analista/partidos-analista';
import { EncuestasAnalista } from './pages/analista/encuestas-analista/encuestas-analista';
import { ResultadosAnalista } from './pages/analista/resultados-analista/resultados-analista';
import { PrediccionesAnalista } from './pages/analista/predicciones-analista/predicciones-analista';
import { ReportesAnalista } from './pages/analista/reportes-analista/reportes-analista';
import { AsistenteAnalista } from './pages/analista/asistente-analista/asistente-analista';
import { EstadisticasAnalista } from './pages/analista/estadisticas-analista/estadisticas-analista';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', component: DashboardPublic },
  { path: 'predicciones', component: PublicPredictions },
  { path: 'asistente', component: PublicAssistant },
  { path: 'login', component: Login },
  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMINISTRADOR'] },
    children: [
      { path: '',           redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',  component: DashboardAdmin  },
      { path: 'partidos',   component: Partidos        },
      { path: 'candidatos', component: Candidatos      },
      { path: 'elecciones', component: Elecciones      },
      { path: 'encuestas',  component: Encuestas       },
      { path: 'resultados', component: Resultados      },
      { path: 'reportes',   component: Reportes        },
      { path: 'usuarios',   component: Usuarios        },
      { path: 'auditoria',  component: Auditoria       },
    ]
  },
  {
    path: 'analista',
    component: AnalistaLayout,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ANALISTA', 'ADMINISTRADOR'] },
    children: [
      { path: '',              redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',     component: DashboardAnalista     },
      { path: 'candidatos',    component: CandidatosAnalista    },
      { path: 'partidos',      component: PartidosAnalista      },
      { path: 'encuestas',     component: EncuestasAnalista     },
      { path: 'resultados',    component: ResultadosAnalista    },
      { path: 'predicciones',  component: PrediccionesAnalista  },
      { path: 'reportes',      component: ReportesAnalista      },
      { path: 'asistente',     component: AsistenteAnalista     },
      { path: 'estadisticas',  component: EstadisticasAnalista  },
    ]
  },
  { path: '**', redirectTo: '' }
];