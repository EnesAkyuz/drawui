"use client";

import type React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

export function getComponentFromRegistry(
  type: string,
): React.ComponentType<any> | undefined {
  return componentRegistry[type.toLowerCase()];
}
