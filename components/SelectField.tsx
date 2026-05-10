import { useState } from "react";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { appColors, appRadius } from "../constants/theme";
type SelectFieldProps = {
  label: string;
  placeholder: string;
  options: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
};

export function SelectField({
  label,
  placeholder,
  options,
  selectedValue,
  onSelect,
}: SelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOptions = options.filter((option) =>
    option.toLocaleLowerCase("tr-TR").includes(search.toLocaleLowerCase("tr-TR"))
  );

  function handleSelect(value: string) {
    onSelect(value);
    setSearch("");
    setIsOpen(false);
  }

  return (
    <View style={styles.selectWrapper}>
      <Text style={styles.selectLabel}>{label}</Text>

      <TouchableOpacity style={styles.selectBox} onPress={() => setIsOpen(true)}>
        <Text
          style={[
            styles.selectBoxText,
            !selectedValue && styles.selectBoxPlaceholder,
          ]}
        >
          {selectedValue || placeholder}
        </Text>

        <Text style={styles.selectArrow}>⌄</Text>
      </TouchableOpacity>

      <Modal visible={isOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>

              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Text style={styles.modalClose}>Kapat</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Ara..."
              placeholderTextColor="#6b7280"
            />

            <ScrollView style={styles.optionList}>
              {filteredOptions.length === 0 ? (
                <Text style={styles.noResultText}>Sonuç bulunamadı</Text>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = selectedValue === option;

                  return (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.modalOption,
                        isSelected && styles.modalOptionActive,
                      ]}
                      onPress={() => handleSelect(option)}
                    >
                      <Text
                        style={[
                          styles.modalOptionText,
                          isSelected && styles.modalOptionTextActive,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  selectWrapper: {
    marginBottom: 16,
  },
  selectLabel: {
    color: appColors.text,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 8,
  },
  selectBox: {
    minHeight: 52,
    borderRadius: appRadius.md,
    backgroundColor: appColors.card,
    borderWidth: 1,
    borderColor: appColors.border,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectBoxText: {
    color: appColors.text,
    fontSize: 15,
    fontWeight: "800",
    flex: 1,
  },
  selectBoxPlaceholder: {
    color: appColors.placeholder,
  },
  selectArrow: {
    color: appColors.primary,
    fontSize: 22,
    fontWeight: "900",
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: appColors.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: appColors.background,
    borderTopLeftRadius: appRadius.modal,
    borderTopRightRadius: appRadius.modal,
    padding: 20,
    maxHeight: "82%",
    borderWidth: 1,
    borderColor: appColors.border,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  modalTitle: {
    color: appColors.text,
    fontSize: 22,
    fontWeight: "900",
  },
  modalClose: {
    color: appColors.primary,
    fontSize: 15,
    fontWeight: "900",
  },
  searchInput: {
    height: 48,
    borderRadius: appRadius.sm,
    backgroundColor: appColors.card,
    color: appColors.text,
    paddingHorizontal: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: appColors.border,
    marginBottom: 12,
  },
  optionList: {
    maxHeight: 420,
  },
  modalOption: {
    minHeight: 50,
    borderRadius: appRadius.sm,
    backgroundColor: appColors.card,
    justifyContent: "center",
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  modalOptionActive: {
    backgroundColor: appColors.primary,
    borderColor: appColors.primary,
  },
  modalOptionText: {
    color: appColors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  modalOptionTextActive: {
    color: appColors.primaryText,
  },
  noResultText: {
    color: appColors.softText,
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 20,
  },
});