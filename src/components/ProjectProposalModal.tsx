import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProjectFormData } from "@/types/project";
import { useToast } from "@/hooks/use-toast";

interface ProjectProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectFormData, isApproved: boolean) => void;
}

export const ProjectProposalModal = ({ 
  isOpen, 
  onClose, 
  onSubmit 
}: ProjectProposalModalProps) => {
  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    shortDescription: '',
    longDescription: '',
  });
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pin, setPin] = useState('');
  const { toast } = useToast();

  const handleInputChange = (field: keyof ProjectFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };


  const handleSubmit = (isApproved: boolean) => {
    if (!formData.title || !formData.shortDescription || !formData.longDescription) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (isApproved) {
      setShowPinDialog(true);
    } else {
      onSubmit(formData, false);
      resetForm();
      onClose();
      toast({
        title: "Project Saved",
        description: "Your project has been saved as unapproved.",
      });
    }
  };

  const handlePinSubmit = () => {
    // Mock PIN validation - in real app this would be validated against parent's PIN
    if (pin === '1234') {
      onSubmit(formData, true);
      resetForm();
      setShowPinDialog(false);
      onClose();
      toast({
        title: "Project Approved",
        description: "Your project has been approved and added!",
      });
    } else {
      toast({
        title: "Invalid PIN",
        description: "The PIN you entered is incorrect.",
        variant: "destructive",
      });
    }
    setPin('');
  };

  const resetForm = () => {
    setFormData({
      title: '',
      shortDescription: '',
      longDescription: '',
    });
  };

  if (showPinDialog) {
    return (
      <Dialog open={showPinDialog} onOpenChange={() => setShowPinDialog(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Parent PIN</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="pin">PIN Code</Label>
              <Input
                id="pin"
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter 4-digit PIN"
                maxLength={4}
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={handlePinSubmit} className="flex-1">
                Confirm
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowPinDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Propose New Project</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Project Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter project title"
            />
          </div>

          <div>
            <Label htmlFor="shortDescription">Short Description *</Label>
            <Textarea
              id="shortDescription"
              value={formData.shortDescription}
              onChange={(e) => handleInputChange('shortDescription', e.target.value)}
              placeholder="Brief description for the project card"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="longDescription">Long Description *</Label>
            <Textarea
              id="longDescription"
              value={formData.longDescription}
              onChange={(e) => handleInputChange('longDescription', e.target.value)}
              placeholder="Detailed project description"
              rows={4}
            />
          </div>


          <div className="flex gap-3 pt-4">
            <Button 
              onClick={() => handleSubmit(true)}
              className="flex-1"
            >
              Approve Project
            </Button>
            <Button 
              variant="outline"
              onClick={() => handleSubmit(false)}
              className="flex-1"
            >
              Save as Unapproved
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};