'use client';

import type React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

export const componentRegistry: Record<string, React.ComponentType<any>> = {
  button: Button,
  input: Input,
  card: Card,
  cardheader: CardHeader,
  cardcontent: CardContent,
  cardfooter: CardFooter,
  cardtitle: CardTitle,
  carddescription: CardDescription,
  label: Label,
  textarea: Textarea,
  select: Select,
  selecttrigger: SelectTrigger,
  selectvalue: SelectValue,
  selectcontent: SelectContent,
  selectitem: SelectItem,
  checkbox: Checkbox,
  radiogroup: RadioGroup,
  radiogroupitem: RadioGroupItem,
  switch: Switch,
  slider: Slider,
  tabs: Tabs,
  tabslist: TabsList,
  tabstrigger: TabsTrigger,
  tabscontent: TabsContent,
  dialog: Dialog,
  dialogtrigger: DialogTrigger,
  dialogcontent: DialogContent,
  dialogheader: DialogHeader,
  dialogtitle: DialogTitle,
  dialogdescription: DialogDescription,
  dialogfooter: DialogFooter,
  alert: Alert,
  alerttitle: AlertTitle,
  alertdescription: AlertDescription,
  badge: Badge,
  avatar: Avatar,
  avatarimage: AvatarImage,
  avatarfallback: AvatarFallback,
  separator: Separator,
  tooltip: Tooltip,
  tooltiptrigger: TooltipTrigger,
  tooltipcontent: TooltipContent,
  tooltipprovider: TooltipProvider,
};

export function getComponentFromRegistry(type: string): React.ComponentType<any> | undefined {
  return componentRegistry[type.toLowerCase()];
}
