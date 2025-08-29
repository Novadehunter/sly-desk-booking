import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, MessageSquare, User, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Post {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
  user_id: string;
  profiles?: {
    display_name: string | null;
    department: string | null;
  };
}

const postSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
});

type PostFormData = z.infer<typeof postSchema>;

export const PostsList = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: '',
      content: '',
    },
  });

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('id, title, content, image_url, created_at, user_id')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Fetch profiles for each unique user_id
      const userIds = [...new Set(postsData?.map(post => post.user_id) || [])];
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, department')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Map profiles to posts
      const postsWithProfiles = postsData?.map(post => ({
        ...post,
        profiles: profilesData?.find(profile => profile.user_id === post.user_id) || null
      })) || [];

      setPosts(postsWithProfiles);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error Loading Posts",
        description: "Failed to load posts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const onSubmit = async (data: PostFormData) => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('posts')
        .insert({
          title: data.title,
          content: data.content,
          user_id: user.id,
        });

      if (error) throw error;

      toast({
        title: "Post Created",
        description: "Your post has been shared successfully.",
      });

      form.reset();
      setIsCreateOpen(false);
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error Creating Post",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-primary">Ministry Updates</h2>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-primary">Ministry Updates</h2>
        {user && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Share Update
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Share an Update</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Update title..."
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Share your update..."
                            rows={4}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      {isSubmitting ? 'Posting...' : 'Share Update'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">No updates yet</p>
            <p className="text-muted-foreground">
              {user ? "Be the first to share an update!" : "Sign in to share updates."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="shadow-card hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">
                        {post.profiles?.display_name || 'Ministry User'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(post.created_at), 'PPp')}
                      </div>
                    </div>
                  </div>
                  {post.profiles?.department && (
                    <Badge variant="secondary">{post.profiles.department}</Badge>
                  )}
                </div>
                <CardTitle className="text-lg">{post.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-card-foreground whitespace-pre-wrap">{post.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};