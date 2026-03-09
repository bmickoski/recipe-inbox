import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-add-recipe-bar',
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './add-recipe-bar.component.html',
  styleUrl: './add-recipe-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddRecipeBarComponent {
  @Input({ required: true }) value = '';
  @Input() loading = false;

  @Output() valueChange = new EventEmitter<string>();
  @Output() save = new EventEmitter<void>();
}
