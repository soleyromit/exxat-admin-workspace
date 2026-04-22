import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Skeleton } from '../ui/skeleton';
import { Eye, RefreshCw, AlertCircle, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { MEDICAL_IMAGE_IDS, type ImageCategory, getImageAltText } from '../../utils/local-images';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface ImageManagerProps {
  readonly?: boolean;
  allowedCategories?: ImageCategory[];
  onImageSelect?: (imageId: string) => void;
}

export const ImageManager: React.FC<ImageManagerProps> = ({
  readonly = false,
  allowedCategories,
  onImageSelect,
}) => {
  // State management
  const [loading, setLoading] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');

  // Get all available images from MEDICAL_IMAGE_IDS
  const allImages = Object.entries(MEDICAL_IMAGE_IDS).map(([key, id]) => ({
    id,
    key,
    category: getCategoryFromKey(key),
    altText: getImageAltText(id)
  }));

  // Filter images by category
  const filteredImages = selectedCategory === 'all' 
    ? allImages 
    : allImages.filter(img => img.category === selectedCategory);

  // Helper function to determine category from image key
  function getCategoryFromKey(key: string): ImageCategory {
    if (key.includes('HOSPITAL') || key.includes('OPERATING') || key.includes('ICU') || key.includes('EMERGENCY')) {
      return 'hospital';
    }
    if (key.includes('CLINIC') || key.includes('DOCTOR')) {
      return 'clinic';
    }
    if (key.includes('LECTURE') || key.includes('LAB') || key.includes('SIMULATION') || key.includes('ANATOMY')) {
      return 'education';
    }
    if (key.includes('STUDENT') || key.includes('MENTOR')) {
      return 'students';
    }
    if (key.includes('EQUIPMENT') || key.includes('ULTRASOUND') || key.includes('XRAY') || key.includes('COMPUTER')) {
      return 'technology';
    }
    if (key.includes('TEAM')) {
      return 'team';
    }
    return 'general';
  }

  // Get unique categories
  const categories: ImageCategory[] = Array.from(new Set(allImages.map(img => img.category)));

  // Handle refresh (just a visual effect for local images)
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="p-3">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <Skeleton className="aspect-video w-full rounded" />
              </CardContent>
              <CardFooter className="p-3 pt-0">
                <Skeleton className="h-8 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">Image Library</h2>
          <Select 
            value={selectedCategory} 
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Images ({allImages.length})</SelectItem>
              {categories.map((category) => {
                const count = allImages.filter(img => img.category === category).length;
                return (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)} ({count})
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Info Alert */}
      <Alert>
        <ImageIcon className="h-4 w-4" />
        <AlertDescription>
          Showing {filteredImages.length} medical education and healthcare images. 
          Images are sourced from Unsplash and cached locally.
        </AlertDescription>
      </Alert>

      {/* Images Grid */}
      {filteredImages.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredImages.map((image) => (
            <Card key={image.id} className="overflow-hidden">
              <CardHeader className="p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm truncate" title={image.id}>
                    {image.key.replace(/_/g, ' ').toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {image.category}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="p-3 pt-0">
                <div className="aspect-video relative bg-muted rounded overflow-hidden">
                  <ImageWithFallback
                    src={`https://source.unsplash.com/800x600/?${encodeURIComponent(image.altText)}`}
                    alt={image.altText}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {image.altText}
                  </p>
                </div>
              </CardContent>

              <CardFooter className="p-3 pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    if (onImageSelect) {
                      onImageSelect(image.id);
                    }
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {onImageSelect ? 'Select' : 'View'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {filteredImages.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground text-center">
              No images found in this category.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImageManager;
