# ✅ Verificación de Migraciones Sprint 2

## Instrucciones

1. Abre [Supabase Dashboard](https://aracmkttghzxdnujxuca.supabase.co)
2. Ve a **SQL Editor** (en el menú izquierdo)
3. Copia y pega el contenido de `sql/migraciones_pendientes_completas.sql`
4. Haz clic en **RUN** (o presiona Ctrl+Enter)
5. Si ves "Success. No rows returned" en todas las consultas, está OK.

---

## Verificación Manual (después de ejecutar)

### 1. Verificar columnas en court_availability

Ejecuta esta consulta en SQL Editor:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'court_availability'
  AND column_name IN ('status', 'booker_id', 'booker_note', 'time_to')
ORDER BY column_name;
```

**Resultado esperado:**
- `status` (text)
- `booker_id` (uuid)
- `booker_note` (text)
- `time_to` (text)

Si faltan, la migración no se ejecutó correctamente.

---

### 2. Verificar RLS policies aplicadas

```sql
SELECT schemaname, tablename, policyname, permissive, cmd, qual
FROM pg_policies
WHERE tablename = 'court_availability'
ORDER BY policyname;
```

**Resultados esperados (4 filas):**
1. `court_availability_select_all` → SELECT
2. `court_availability_insert_auth` → INSERT
3. `court_availability_update_owner` → UPDATE
4. `court_availability_delete_owner` → DELETE

---

### 3. Verificar player_stats policy

```sql
SELECT schemaname, tablename, policyname, permissive, cmd, qual
FROM pg_policies
WHERE tablename = 'player_stats';
```

Debe incluir al menos:
- `player_stats_select_all` → SELECT (público)

---

### 4. Probar funcionalidad (en la app)

1. **Como jugador**:
   - Ir a `/(player)/reservas`
   - Entrar en un complejo
   - Si existe `app/(player)/court/[id].tsx`, intentar reservar un horario
   - Debería crear una fila en `court_availability` con `status = 'pending'`

2. **Como dueño**:
   - Login con usuario dueño
   - Ir a `/(owner)/reservas`
   - Debería ver reservas pendientes con botones Confirmar/Rechazar
   - Al confirmar, debe cambiar `status = 'confirmed'` y enviar notificación

---

## Troubleshooting

### Error: "column ... does not exist"
→ No se ejecutó la migración. Volver a ejecutar `migraciones_pendientes_completas.sql`.

### Error: "permission denied for court_availability"
→ RLS no está deshabilitado para tu usuario. Las policies deben permitir acceso.

### Reservas no aparecen en owner/reservas
→ Verificar que `owner_id` en `courts` esté correctamente asignado
→ Verificar que el usuario dueño tenga `role = 'owner'` en `profiles`

### No puedo insertar en court_availability
→ Verificar que la policy `court_availability_insert_auth` exista
→ Verificar que el usuario esté autenticado (no anónimo)

---

## Siguientes Pasos (después de verificar)

Una vez que las migraciones estén OK, continuamos con:

1. **Sincronización de niveles** (resolver inconsistencia `players.level` vs `player_stats.level`)
2. **Implementar detalle de cancha** (`court/[id].tsx`) con DatePicker/TimePicker
3. **Probar flujo completo de reserva**: jugador reserva → dueño confirma → notificación
