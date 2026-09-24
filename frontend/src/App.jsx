import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { format } from 'date-fns';
import {
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Filter,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
});

const fetchDashboard = async () => (await api.get('/dashboard/')).data;
const fetchEvents = async ({ queryKey }) => {
  const [_key, params] = queryKey;
  const res = await api.get('/events/', { params });
  return res.data;
};

const fmt = (value) => (value ? format(new Date(value), 'PPP p') : '—');

function StatCard({ title, value, helper, icon }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box>
            <Typography variant="body2" color="text.secondary">{title}</Typography>
            <Typography variant="h4" sx={{ mt: 1 }}>{value}</Typography>
            {helper ? <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">{helper}</Typography> : null}
          </Box>
          <Box sx={{ color: 'primary.main' }}>{icon}</Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function EventFormDialog({ open, onClose, onSubmit, initial }) {
  const [form, setForm] = useState(initial ?? {
    title: '',
    description: '',
    venue_name: '',
    venue_address: '',
    start_date: '',
    end_date: '',
    capacity: 100,
    status: 'draft',
  });
  const [error, setError] = useState('');

  React.useEffect(() => {
    setForm(initial ?? {
      title: '', description: '', venue_name: '', venue_address: '', start_date: '', end_date: '', capacity: 100, status: 'draft',
    });
  }, [initial, open]);

  const update = (name, value) => setForm((p) => ({ ...p, [name]: value }));

  const submit = async () => {
    if (!form.title || !form.start_date || !form.end_date) {
      setError('Please fill in the required fields.');
      return;
    }
    setError('');
    await onSubmit(form);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{initial ? 'Edit Event' : 'Create Event'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <TextField label="Title" value={form.title} onChange={(e) => update('title', e.target.value)} required fullWidth />
          <TextField label="Description" value={form.description} onChange={(e) => update('description', e.target.value)} multiline minRows={3} fullWidth />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}><TextField label="Venue name" value={form.venue_name} onChange={(e) => update('venue_name', e.target.value)} fullWidth /></Grid>
            <Grid item xs={12} md={6}><TextField label="Venue address" value={form.venue_address} onChange={(e) => update('venue_address', e.target.value)} fullWidth /></Grid>
            <Grid item xs={12} md={4}><TextField label="Start date/time" type="datetime-local" value={form.start_date} onChange={(e) => update('start_date', e.target.value)} InputLabelProps={{ shrink: true }} fullWidth required /></Grid>
            <Grid item xs={12} md={4}><TextField label="End date/time" type="datetime-local" value={form.end_date} onChange={(e) => update('end_date', e.target.value)} InputLabelProps={{ shrink: true }} fullWidth required /></Grid>
            <Grid item xs={12} md={4}><TextField label="Capacity" type="number" value={form.capacity} onChange={(e) => update('capacity', Number(e.target.value))} fullWidth /></Grid>
          </Grid>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={form.status} onChange={(e) => update('status', e.target.value)}>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="published">Published</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function App() {
  const [tab, setTab] = useState(0);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('-start_date');
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [page, setPage] = useState(1);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const params = useMemo(() => ({
    search: query || undefined,
    status: status || undefined,
    ordering: sort,
    page,
    start_date_after: dateFrom ? dayjs(dateFrom).format('YYYY-MM-DD') : undefined,
    start_date_before: dateTo ? dayjs(dateTo).format('YYYY-MM-DD') : undefined,
  }), [query, status, sort, page, dateFrom, dateTo]);

  const dashboard = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboard });
  const events = useQuery({ queryKey: ['events', params], queryFn: fetchEvents, keepPreviousData: true });

  const openCreate = () => { setEditing(null); setOpenForm(true); };
  const openEdit = (event) => { setEditing(event); setOpenForm(true); };

  const activeList = events.data?.results ?? [];

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <AppBar position="sticky" elevation={0} color="transparent" sx={{ borderBottom: 1, borderColor: 'divider', backdropFilter: 'blur(12px)' }}>
          <Toolbar>
            <CalendarDays size={24} />
            <Typography variant="h6" sx={{ ml: 1, flexGrow: 1 }}>EventFlow</Typography>
            <Button startIcon={<CalendarPlus size={16} />} variant="contained" onClick={openCreate}>New Event</Button>
          </Toolbar>
        </AppBar>

        <Container sx={{ py: 4 }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h4">Dashboard</Typography>
              <Typography color="text.secondary">Manage events, registrations, venues, and attendees in one place.</Typography>
            </Box>

            {dashboard.isError ? <Alert severity="error">Unable to load dashboard.</Alert> : null}
            {dashboard.isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box> : null}

            {dashboard.data ? (
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}><StatCard title="Upcoming Events" value={dashboard.data.stats.upcoming_events} helper="Next 30 days" icon={<CalendarDays />} /></Grid>
                <Grid item xs={12} md={3}><StatCard title="Registrations" value={dashboard.data.stats.total_registrations} helper="All time" icon={<Users />} /></Grid>
                <Grid item xs={12} md={3}><StatCard title="Capacity Used" value={`${dashboard.data.stats.capacity_utilization}%`} helper="Across active events" icon={<Filter />} /></Grid>
                <Grid item xs={12} md={3}><StatCard title="Venues" value={dashboard.data.stats.total_venues} helper="Managed venues" icon={<CalendarDays />} /></Grid>
              </Grid>
            ) : null}

            <Paper sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                  <TextField fullWidth placeholder="Search events" value={query} onChange={(e) => { setPage(1); setQuery(e.target.value); }} InputProps={{ startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment> }} />
                  <FormControl sx={{ minWidth: 160 }}>
                    <InputLabel>Status</InputLabel>
                    <Select label="Status" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="draft">Draft</MenuItem>
                      <MenuItem value="published">Published</MenuItem>
                      <MenuItem value="cancelled">Cancelled</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Sort</InputLabel>
                    <Select label="Sort" value={sort} onChange={(e) => setSort(e.target.value)}>
                      <MenuItem value="-start_date">Start date (newest)</MenuItem>
                      <MenuItem value="start_date">Start date (oldest)</MenuItem>
                      <MenuItem value="title">Title A-Z</MenuItem>
                      <MenuItem value="-registrations_count">Most registrations</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <DatePicker label="From" value={dateFrom} onChange={setDateFrom} slotProps={{ textField: { fullWidth: true } }} />
                  <DatePicker label="To" value={dateTo} onChange={setDateTo} slotProps={{ textField: { fullWidth: true } }} />
                </Stack>
              </Stack>
            </Paper>

            <Paper sx={{ p: 2 }}>
              <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
                <Tab label="Events" />
                <Tab label="Calendar" />
                <Tab label="Analytics" />
              </Tabs>

              {tab === 0 && (
                <Stack spacing={2}>
                  {events.isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box> : null}
                  {events.isError ? <Alert severity="error">Failed to load events.</Alert> : null}
                  {!events.isLoading && !activeList.length ? <Alert severity="info">No events found.</Alert> : null}
                  {activeList.map((event) => (
                    <Card key={event.id} variant="outlined">
                      <CardContent>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
                          <Box>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                              <Typography variant="h6">{event.title}</Typography>
                              <Chip size="small" label={event.status} color={event.status === 'published' ? 'success' : event.status === 'cancelled' ? 'error' : 'default'} />
                            </Stack>
                            <Typography color="text.secondary" sx={{ mb: 1 }}>{event.description || 'No description provided.'}</Typography>
                            <Typography variant="body2">{fmt(event.start_date)} → {fmt(event.end_date)}</Typography>
                            <Typography variant="body2">Venue: {event.venue?.name || 'TBD'} • Registrations: {event.registrations_count ?? 0}</Typography>
                          </Box>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Tooltip title="Edit"><IconButton onClick={() => openEdit(event)}><Edit3 size={16} /></IconButton></Tooltip>
                            <Tooltip title="Delete"><IconButton color="error"><Trash2 size={16} /></IconButton></Tooltip>
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Button startIcon={<ChevronLeft size={16} />} disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
                    <Typography variant="body2">Page {page}</Typography>
                    <Button endIcon={<ChevronRight size={16} />} disabled={!events.data?.next} onClick={() => setPage((p) => p + 1)}>Next</Button>
                  </Stack>
                </Stack>
              )}

              {tab === 1 && (
                <Alert severity="info">Calendar view is powered by the same events API and can be extended with a calendar grid or agenda layout.</Alert>
              )}

              {tab === 2 && (
                <Stack spacing={2}>
                  <Typography variant="h6">Statistics</Typography>
                  <Divider />
                  <Typography>Top-level analytics are exposed from the backend dashboard endpoint and can be visualized here with charts.</Typography>
                </Stack>
              )}
            </Paper>
          </Stack>
        </Container>

        <EventFormDialog open={openForm} onClose={() => setOpenForm(false)} initial={editing} onSubmit={async () => setOpenForm(false)} />
      </Box>
    </LocalizationProvider>
  );
}
