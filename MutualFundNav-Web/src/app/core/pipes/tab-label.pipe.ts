import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'tabLabel' })
export class TabLabelPipe implements PipeTransform {
  transform(tabs: { id: string; label: string }[], activeId: string): string {
    return tabs.find(t => t.id === activeId)?.label ?? '';
  }
}
