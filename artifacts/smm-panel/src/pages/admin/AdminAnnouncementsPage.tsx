import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Plus,
  Megaphone,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  Pencil,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAdmin } from '@/hooks/useAdmin'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/formatters'
import type { Announcement } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const typeConfig = {
  info: { icon: Info, color: 'bg-blue-500/10 text-blue-500', badge: 'bg-blue-500/10 text-blue-500 border-blue-500/20', label: 'Info' },
  warning: { icon: AlertTriangle, color: 'bg-amber-500/10 text-amber-500', badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20', label: 'Warning' },
  success: { icon: CheckCircle, color: 'bg-emerald-500/10 text-emerald-500', badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', label: 'Success' },
  error: { icon: XCircle, color: 'bg-red-500/10 text-red-500', badge: 'bg-red-500/10 text-red-500 border-red-500/20', label: 'Error' },
  announcement: { icon: Megaphone, color: 'bg-purple-500/10 text-purple-500', badge: 'bg-purple-500/10 text-purple-500 border-purple-500/20', label: 'Announcement' },
}

type AnnouncementType = keyof typeof typeConfig

interface FormState {
  title: string
  content: string
  type: AnnouncementType
  expires_at: string
  is_active: boolean
}

const defaultForm: FormState = {
  title: '',
  content: '',
  type: 'info',
  expires_at: '',
  is_active: true,
}

async function fetchAllAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export default function AdminAnnouncementsPage() {
  const navigate = useNavigate()
  const { isAdmin, isLoading: adminLoading } = useAdmin()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Announcement | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(defaultForm)

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: fetchAllAnnouncements,
    enabled: isAdmin,
  })

  const createMutation = useMutation({
    mutationFn: async (f: FormState) => {
      const { error } = await supabase.from('announcements').insert({
        title: f.title,
        content: f.content,
        type: f.type,
        is_active: f.is_active,
        published_at: f.is_active ? new Date().toISOString() : null,
        expires_at: f.expires_at || null,
        created_by: user!.id,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] })
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      toast.success('Announcement created')
      setDialogOpen(false)
      setForm(defaultForm)
    },
    onError: () => toast.error('Failed to create announcement'),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, f }: { id: string; f: FormState }) => {
      const { error } = await supabase
        .from('announcements')
        .update({
          title: f.title,
          content: f.content,
          type: f.type,
          is_active: f.is_active,
          published_at: f.is_active ? new Date().toISOString() : null,
          expires_at: f.expires_at || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] })
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      toast.success('Announcement updated')
      setDialogOpen(false)
      setEditTarget(null)
      setForm(defaultForm)
    },
    onError: () => toast.error('Failed to update announcement'),
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from('announcements')
        .update({
          is_active: active,
          published_at: active ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data, { active }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] })
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      toast.success(active ? 'Announcement activated' : 'Announcement deactivated')
    },
    onError: () => toast.error('Failed to toggle announcement'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('announcements').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] })
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      toast.success('Announcement deleted')
      setDeleteTarget(null)
    },
    onError: () => toast.error('Failed to delete announcement'),
  })

  if (adminLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
      </div>
    )
  }

  if (!isAdmin) {
    navigate('/dashboard')
    return null
  }

  const openCreate = () => {
    setEditTarget(null)
    setForm(defaultForm)
    setDialogOpen(true)
  }

  const openEdit = (a: Announcement) => {
    setEditTarget(a)
    setForm({
      title: a.title,
      content: a.content,
      type: a.type as AnnouncementType,
      expires_at: a.expires_at ? a.expires_at.slice(0, 16) : '',
      is_active: a.is_active,
    })
    setDialogOpen(true)
  }

  const handleSubmit = () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and content are required')
      return
    }
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, f: form })
    } else {
      createMutation.mutate(form)
    }
  }

  const activeCount = announcements?.filter((a) => a.is_active).length ?? 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Announcements</h1>
          <p className="text-muted-foreground">
            Broadcast messages to all users · {activeCount} active
          </p>
        </div>
        <Button onClick={openCreate} className="bg-amber-500 hover:bg-amber-600 text-white">
          <Plus className="h-4 w-4 mr-2" />
          New Announcement
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : !announcements?.length ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Megaphone className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">No announcements yet</h3>
            <p className="text-muted-foreground mb-4">Create one to broadcast a message to all users.</p>
            <Button onClick={openCreate} className="bg-amber-500 hover:bg-amber-600 text-white">
              <Plus className="h-4 w-4 mr-2" />
              New Announcement
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => {
            const cfg = typeConfig[a.type as AnnouncementType] ?? typeConfig.info
            const Icon = cfg.icon
            return (
              <Card key={a.id} className={`transition-opacity ${!a.is_active ? 'opacity-60' : ''}`}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`h-10 w-10 rounded-lg ${cfg.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-foreground">{a.title}</h3>
                            <Badge variant="outline" className={`text-xs ${cfg.badge}`}>
                              {cfg.label}
                            </Badge>
                            <Badge variant={a.is_active ? 'default' : 'secondary'} className={`text-xs ${a.is_active ? 'bg-emerald-500 text-white' : ''}`}>
                              {a.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{a.content}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Created {formatDate(a.created_at, 'MMM d, yyyy')}
                            </span>
                            {a.published_at && (
                              <span>Published {formatDate(a.published_at, 'MMM d, yyyy HH:mm')}</span>
                            )}
                            {a.expires_at && (
                              <span>Expires {formatDate(a.expires_at, 'MMM d, yyyy HH:mm')}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleMutation.mutate({ id: a.id, active: !a.is_active })}
                            disabled={toggleMutation.isPending}
                            className={a.is_active ? 'text-emerald-500 hover:text-emerald-600' : 'text-muted-foreground'}
                            title={a.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {a.is_active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(a)}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(a.id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditTarget(null); setForm(defaultForm) } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Announcement' : 'New Announcement'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="ann-title">Title</Label>
              <Input
                id="ann-title"
                placeholder="e.g. Scheduled Maintenance"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ann-content">Message</Label>
              <Textarea
                id="ann-content"
                placeholder="Write your announcement here..."
                rows={3}
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as AnnouncementType }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ann-expires">Expires at (optional)</Label>
                <Input
                  id="ann-expires"
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_active ? 'bg-emerald-500' : 'bg-muted'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <Label className="cursor-pointer" onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}>
                {form.is_active ? 'Publish immediately' : 'Save as draft'}
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {editTarget ? 'Save Changes' : 'Publish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the announcement. Users will no longer see it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
